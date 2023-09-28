import re
import os
import json
import uuid
from concurrent.futures import ThreadPoolExecutor, wait
from pathlib import Path
from queue import Empty
from threading import Thread, Lock
from time import sleep
from copy import deepcopy
from traceback import format_exc

from typing import Dict, List, Optional, Any
from pylon.core.tools import log
from jinja2 import Environment, DebugUndefined

from tools import flow_tools, db

from ..constants import SioEvent, OnErrorActions
from ..models.flow import Flow
from ..models.flow_run import FlowRun


class PreviousTaskFailed(Exception):
    "Raised when previous task is faield"


OUTPUT_FOLDER = Path(__file__).parent.parent.joinpath('tmp')
OUTPUT_FOLDER.mkdir(exist_ok=True)


class FlowValidator:
    def __init__(self, module, tasks: dict, project_id: int):
        self.module = module
        self.project_id: int = project_id
        # self.variables = data.get('variables', {})
        self.tasks: dict = tasks
        self.run_id: str = str(uuid.uuid4())
        self.errors: dict = {}
        self.validated_data: dict = {}
        self._lock = Lock()

    def run_validation(self, task_id: int, task_config: dict) -> None:
        # rpc_name = f"{task_config['rpc_name']}__validate"

        log.info('run_validation %s %s', task_id, task_config)
        validator_rpc_name = flow_tools.get_validator_rpc_name(task_config['flow_meta']['uid'])

        # loading rpc function object
        rpc_obj = getattr(self.module.context.rpc_manager.timeout(5), validator_rpc_name)
        try:
            # calling rpc
            log.info(f'running rpc {validator_rpc_name} with kwargs {task_config["params"]}')
            result = rpc_obj(**task_config['params'])

        except Empty:
            result = {'errors': [f"No rpc function found: {validator_rpc_name}"]}
        except Exception as e:
            result = {'errors': [f"Error happened during validation: {type(e)} {e}"]}

        with self._lock:
            if not result.get('ok'):
                self.errors[task_id] = result.get('errors')
            else:
                self.validated_data[task_id] = result.get('result')

    def validate(self) -> None:
        # reset old data first
        self.errors = {}
        self.validated_data = {}

        # Validating RPC functions
        threads = []
        for task_id, task_config in self.tasks.items():
            th = Thread(target=self.run_validation, args=(task_id, task_config))
            th.start()
            threads.append(th)

        for thread in threads:
            thread.join()

    @property
    def ok(self) -> bool:
        return not bool(self.errors)

    @property
    def event_payload(self) -> dict:
        return dict(
            validated_data=self.validated_data,
            project_id=self.project_id,
            tasks=self.tasks,
            run_id=self.run_id,
        )


class FlowExecutor:
    MAIN_OUTPUT_FILE = "main_output.json"
    MAX_THREADS = 10

    @classmethod
    def from_validator(cls, flow_id, validator: FlowValidator, sync):
        return cls(
            module=validator.module,
            flow_id=flow_id,
            sync=sync,
            **validator.event_payload
        )

    def __init__(self, module, flow_id: int, sync: bool, validated_data: dict, project_id: int, tasks: dict,
                 run_id: str, variables: dict = None):
        self.module = module
        self.context = module.context
        self.validated_data = validated_data
        self.project_id = project_id
        self.variables = variables or {}
        self.tasks = tasks
        self.run_id = run_id
        self.flow_id = flow_id
        self.sync = sync
        self._errors = {}

        # creating run_id folder
        self._folder_path = OUTPUT_FOLDER.joinpath(self.run_id)
        self._folder_path.mkdir(exist_ok=True)

        # creating main output file
        self._main_file_path = self._folder_path.joinpath(self.MAIN_OUTPUT_FILE)
        self._write_to_file({}, self._main_file_path)

        self._file_lock = Lock()
        self._stop_flow_lock = Lock()
        self._stop_flow = False
        self._update_db_lock = Lock()

    def consider_stopping_flow(self, task_id: int, task_health: bool) -> None:
        if not (task_health or self._is_task_skippable(task_id)):
            self._signal_task_failed()

    def _is_task_skippable(self, task_id: int) -> bool:
        return self.tasks.get(task_id, {}).get('on_failure') == OnErrorActions.ignore

    def _signal_task_failed(self) -> None:
        with self._stop_flow_lock:
            self._stop_flow = True

    def _read_results(self):
        with open(self._main_file_path, 'r') as file:
            return json.load(file)

    def _write_result(self, task_id: int, result: dict, joined_values: dict):
        on_success_name = self.tasks[task_id].get('name')
        if not (on_success_name and result['ok']):
            return
        # start node
        if on_success_name == "flowy_start":
            joined_values.update(result['result'])
        else:
            joined_values[on_success_name] = result['result']
        #
        with self._file_lock:
            current_values: dict = self._read_results()
            current_values.update(joined_values)
            self._write_to_file(current_values, self._main_file_path)

    def _write_to_file(self, result: dict, output_path: Path | str) -> None:
        # logging output of the current step
        with open(Path(output_path), 'w') as out_file:
            json.dump(result, out_file, indent=4)

    def _resolve_fields(self, original_value: Any, values: dict):
        placeholder_pattern = r"\s*{{\s*([a-zA-Z0-9_]+)\s*}}\s*"

        if isinstance(original_value, dict):
            resolved_payload = {}
            for key, value in original_value.items():
                resolved_value = self._resolve_fields(value, values)
                resolved_payload[key] = resolved_value
            return resolved_payload

        elif isinstance(original_value, list):
            resolved_payload = []
            for item in original_value:
                resolved_item = self._resolve_fields(item, values)
                resolved_payload.append(resolved_item)
            return resolved_payload

        elif isinstance(original_value, str):
            if match := re.fullmatch(placeholder_pattern, original_value):
                name = match.group(1)
                value = values[name]
                return value
            else:
                environment = Environment(undefined=DebugUndefined)
                template = environment.from_string(original_value)
                result = template.render(**values)
                return result
        return original_value

    def generate_steps_conf(self, data: Dict):
        result: Dict[int, List[str]] = dict()
        for task_id, conf in data.items():
            if 'step' not in conf:
                log.error("Invalid configuration data: step field doesn't exist")
                return
            step = conf['step']
            if step in result:
                result[step].append(task_id)
                continue
            result[step] = [task_id]
        return dict(sorted(result.items()))  # todo: what is the key here?

    def get_flow_context(self, prev_values, task_config):
        return {
            'project_id': self.project_id,
            'outputs': deepcopy(prev_values),
            'module': self.module,
            'task_config': task_config,
            'tasks': self.tasks,
            'run_id': self.run_id,
            "flow_id": self.flow_id,
        }

    def _call_run_task(self, uid: str, params):
        # Executing rpc function
        rpc_name = flow_tools.get_rpc_name(uid)
        rpc_obj = getattr(self.context.rpc_manager.timeout(10), rpc_name)
        return rpc_obj(**params)

    @staticmethod
    def obj_to_dict(obj: Any) -> dict:
        try:
            result = obj.dict()
        except AttributeError:
            result = dict(obj)
        return result


    def _execute_task(self, task_id: int) -> None:
        # log.info(f'Original Thread started: {os.getpid()} -> {task_id}')
        meta = self.tasks[task_id]
        clean_data = self.validated_data[task_id]
        params = self.obj_to_dict(clean_data)
        self.on_node_started(task_id, meta, params)

        # Loading main joined results
        prev_values = self._read_results()

        # loading rpc function object
        uid = meta['flow_meta']['uid']

        # filling params from inputed data
        for param_name in params.keys():
            try:
                value = self._resolve_fields(params[param_name], prev_values)
                params[param_name] = value
            except Exception as e:
                error_msg = f"Failed to infer {param_name} for {params[param_name]} in {uid}(id: {task_id}) task"
                log.error('%s: %s %s', type(e), e, error_msg)
                log.info(format_exc())
                self.on_node_error(task_id, meta, error_msg)
                return self.consider_stopping_flow(task_id, task_health=False)

        # log.info('clean_data.__class__: %s', clean_data.__class__)
        # log.info('params: %s', params)

        func_kwargs = {
            'flow_context': self.get_flow_context(prev_values, meta),
            'clean_data': clean_data.__class__(**params)
        }

        try:
            result = self._call_run_task(uid, func_kwargs)
        except Empty:
            error_msg = f"No rpc found for {uid}(id: {task_id}) task"
            log.error('%s', error_msg)
            self.on_node_error(task_id, meta, error_msg)
            return self.consider_stopping_flow(task_id, task_health=False)

        # write joined results
        self._write_result(task_id, result, prev_values)

        # Sending info regarding task completion
        rpc_name = flow_tools.get_rpc_name(meta['flow_meta']['uid'])
        result['name'] = uid
        result["rpc_name"] = rpc_name
        result["task_id"] = task_id

        # logging output of the current step
        output_path = self._folder_path.joinpath(f"{task_id}_out.json")
        # output_path.touch(exist_ok=True)
        self._write_to_file(result, output_path)

        if not result['ok']:
            self.on_node_error(task_id, meta, result.get('error'))
        else:
            self.on_node_success(task_id, meta, result)

        # stop flow if current task failed and it is not skippable
        self.consider_stopping_flow(task_id, result['ok'])

        log.info(f"Completed: {task_id}")

    def emit_events(self, topic: SioEvent, payload: dict, *, stringify=False):
        if self.sync:
            return
        sleep(0.01)
        payload['project_id'] = self.project_id
        payload['flow_id'] = self.flow_id
        payload['run_id'] = self.run_id
        if stringify:
            payload = json.dumps(payload)
        self.context.sio.emit(topic, payload)

    def create_db_record(self) -> None:
        log.info('Creating db record for flow: %s, run: %s', self.flow_id, self.run_id)
        with db.with_project_schema_session(self.project_id) as session:
            flow_data = session.query(Flow).with_entities(Flow.flow_data).filter(
                Flow.id == self.flow_id
            ).first()[0]

            # log.info('flow_data %s', flow_data)
            # log.info('self.tasks %s', self.tasks)
            # log.info('self.validated_data %s', self.validated_data)
            # log.info('self.variables %s', self.variables)

            flow_run = FlowRun(
                flow_id=self.flow_id,
                uid=self.run_id,
                flow_data=flow_data,
                steps=self.tasks,
                is_async=not self.sync,
                validated_data=json.loads(json.dumps(self.validated_data, default=lambda o: o.dict())),
                variables=self.variables,
            )
            session.add(flow_run)
            session.commit()

    def update_db_flow_run(self):
        with self._update_db_lock:
            with db.with_project_schema_session(self.project_id) as session:
                try:
                    flow_run = session.query(FlowRun).get(flow_run_id)

                    if flow_run:
                        flow_run.status = new_status
                        session.commit()
                except Exception as e:
                    session.rollback()

    def on_flow_started(self) -> None:
        log.info("FLOW STARTED...")
        self.create_db_record()
        self.emit_events(SioEvent.flow_started, {
            'run_id': self.run_id,
            'project_id': self.project_id,
            'flow_id': self.flow_id
        })

    def on_flow_finished(self) -> None:
        log.info(f"Flow execution DONE: {self.run_id}")

    def on_flow_aborted(self) -> None:
        log.info(f"FLOW ABORTED {self.run_id}")

    def on_step_started(self, step) -> None:
        log.info(f"Step {step} started")

    def on_step_finished(self, step) -> None:
        log.info(f"Step {step} finished")

    def on_node_started(self, node_id: int, meta: dict, params: dict):
        log.info(f'Thread started: {os.getpid()} -> {node_id}')
        # log.info(f'Node meta: {meta} params: {params}')

    def on_node_error(self, node_id: int, meta: dict, error_msg: str) -> None:
        self._errors[node_id] = error_msg
        payload = {
            "ok": False,
            "error": error_msg,
            "node_id": node_id,
            "task_id": node_id,  # keep it for compatibility
        }
        self.emit_events(SioEvent.node_finished, payload)

    def on_node_success(self, node_id: int, meta: dict, result: dict) -> None:
        if not meta.get('log_results') and result['ok']:
            result.pop('result', None)
        self.emit_events(SioEvent.node_finished, result)

    def execute_tasks(self, task_ids: list):
        with ThreadPoolExecutor(max_workers=self.MAX_THREADS) as executor:
            futures = [
                executor.submit(FlowExecutor._execute_task, self, task_id)
                for task_id in task_ids
            ]

            # Wait for all tasks to complete
            wait(futures)

    def run(self):
        #### MAIN
        self.on_flow_started()

        steps_data = self.generate_steps_conf(self.tasks)
        for step, task_ids in steps_data.items():
            self.on_step_started(step)

            # stop when task failed                
            if self._stop_flow:
                self.on_flow_aborted()
                break

            # threads = []
            # for task_id in task_ids:
            #     p = Thread(target=FlowExecutor._execute_task, args=(self, task_id))
            #     p.start()
            #     threads.append(p)
            #
            # for thread in threads:
            #     thread.join()

            # threads.clear()

            self.execute_tasks(task_ids)

            self.on_step_finished(step)
        self.on_flow_finished()

        if self._errors:
            return False, self._errors

        result = self._read_results()
        return True, result.get('flowy_end')


def change_start_node_variables(config: dict, new_variables: List[Dict]):
    new_vars_map = {
        variable['name']: {'value': variable['value'], "type": variable['type']}
        for variable in new_variables
    }
    for task_config in config.values():
        if task_config['name'] == "flowy_start":
            variables: list = task_config['params']['variables']
            for variable in variables:
                var_config = new_vars_map.pop(variable['name'], None)
                if not var_config:
                    continue

                variable['value'] = var_config['value']
                variable['type'] = var_config['type']

            for name, var_config in new_vars_map.items():
                variables.append({
                    "name": name,
                    "type": var_config['type'],
                    "value": var_config['value']
                })
    return config
