import re
import os
import json
from pathlib import Path
from queue import Empty
from threading import Thread, Lock
from copy import deepcopy

from typing import Dict, List
from pylon.core.tools import log
from jinja2 import Environment, DebugUndefined

from tools import flow_tools


class PreviousTaskFailed(Exception):
    "Raised when previous task is faield"


OUTPUT_FOLDER = Path(__file__).parent.parent.joinpath('tmp')
OUTPUT_FOLDER.mkdir(exist_ok=True)


class FlowValidator:
    def __init__(self, module, data):
        self.module = module
        self.context = module.context
        self.data = data
        self.project_id = self.data.get('project_id', None)
        self.variables = self.data.get('variables', {})
        self.tasks = self.data.get('tasks', {})
        self.errors = {}
        self._lock = Lock()

    def run_validation(self, task_id: int, task_config: dict) -> None:
        # rpc_name = f"{task_config['rpc_name']}__validate"

        log.info('run_validation %s %s', task_id, task_config)
        validator_rpc_name = flow_tools.get_validator_rpc_name(task_config['flow_meta']['uid'])

        # loading rpc function object
        rpc_obj = getattr(self.context.rpc_manager.timeout(5), validator_rpc_name)
        try:
            # calling rpc
            log.info(f'running rpc {validator_rpc_name} with kwargs {task_config["params"]}')
            result = rpc_obj(**task_config['params'])

        except Empty:
            result = {'errors': [f"No rpc function found: {validator_rpc_name}"]}
        except Exception as e:
            result = {'errors': [f"Error happened during validation: {type(e)} {e}"]}

        if not result.get('ok'):
            with self._lock:
                self.errors[task_id] = result.get('errors')

    def _validate_variables(self):
        if not self.variables:
            return
        response = self.module.start_flow(self.project_id, self.variables)
        if not response["ok"]:
            del response['ok']
            self.errors['variables'] = response
        else:
            self.variables = response['result']

    def validate(self):
        # validating global variables first
        self._validate_variables()

        # Validating RPC functions
        threads = []
        for task_id, task_config in self.tasks.items():
            th = Thread(target=self.run_validation, args=(task_id, task_config))
            th.start()
            threads.append(th)

        for thread in threads:
            thread.join()

        return self.errors


class FlowExecutor:
    SKIP_CHAR = "skip"
    MAIN_OUTPUT_FILE = "main_output.json"

    def __init__(self, module, data):
        self.module = module
        self.context = module.context
        self.data = data
        self.project_id = self.data.pop('project_id', None)
        self.variables = self.data.get('variables', {})
        self.tasks = self.data.get('tasks', {})
        self.run_id = self.data['run_id']
        self._errors = {}
        # # data
        # data = {'drawflow': {'Home': {'data': {'2': {'id': 2, 'name': 'start', 'data': {
        #     'variables': [{'name': 'cutoff', 'type': 'float', 'value': '0.4'}]}, 'class': 'flow_node', 'html': 'start',
        #                                              'typenode': 'vue', 'inputs': {}, 'outputs': {'output_1': {}},
        #                                              'pos_x': 113, 'pos_y': 15}}}}}

        # creating run_id folder
        self._folder_path = OUTPUT_FOLDER.joinpath(self.run_id)
        self._folder_path.mkdir(exist_ok=True)

        # creating main output file
        self._main_file_path = self._folder_path.joinpath(self.MAIN_OUTPUT_FILE)
        self._write_to_file({}, self._main_file_path)
        
        self._file_lock = Lock()
        self._stop_flow_lock = Lock()
        self._stop_flow = False


    def consider_stopping_flow(self, task_id, task_health):
        if not (task_health or self._is_task_skippable(task_id)):
            self._signal_task_failed()

    def _is_task_skippable(self, task_id):
        return self.tasks.get(task_id, {}).get('on_failure') == self.SKIP_CHAR

    def _signal_task_failed(self):        
        with self._stop_flow_lock:
            self._stop_flow = True

    def _read_results(self):
        with open(self._main_file_path, 'r') as file:
            return json.load(file)

    def _write_result(self, task_id, result, joined_values: dict):
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

    def _write_to_file(self, result, output_path):
        # logging output of the current step
        myfile = Path(output_path)
        myfile.touch(exist_ok=True)
        #
        with open(myfile, "w+") as out_file:
            json.dump(result, out_file, indent=4)

    def _resolve_fields(self, original_value, values):
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
        return dict(sorted(result.items()))

    def get_flow_context(self, prev_values, task_config):
        return {
            'project_id': self.project_id, 
            'outputs': deepcopy(prev_values),
            'module': self.module,
            'task_config': task_config,
            'tasks': self.tasks
        }

    def _execute_task(self, project_id, task_id, meta):
        log.info(f'Thread started: {os.getpid()} -> {task_id}')
        output_path = self._folder_path.joinpath(f"{task_id}_out.json")
        output_path.touch(exist_ok=True)

        # Loading main joined results
        prev_values = self._read_results() 

        # loading rpc function object
        rpc_name = flow_tools.get_rpc_name(meta['flow_meta']['uid'])
        rpc_obj = getattr(self.context.rpc_manager.timeout(10), rpc_name)
        params = {'flow_context': self.get_flow_context(prev_values, meta)}

        # filling params from inputed data
        for param_name, original_value in meta['params'].items():
            try:
                value = self._resolve_fields(original_value, prev_values)
                params[param_name] = value
            except Exception:
                error_msg = f"Failed to infer {param_name} for {original_value} in {task_id} task"
                log.error(error_msg)
                self._errors[task_id] = error_msg
                self.context.event_manager.fire_event("flows_node_finished", json.dumps({
                    "ok": False,
                    "error": error_msg,
                    "task_id": task_id,
                    "run_id": self.run_id
                }))
                return self.consider_stopping_flow(task_id, task_health=False)


        log.info('---------------------------')
        log.info(f"RPC: {rpc_name}")
        # Executing rpc function
        result = rpc_obj(**params)

        # write joined results
        self._write_result(task_id, result, prev_values)

        # Sending info regarding task completion
        rpc_name = flow_tools.get_rpc_name(meta['flow_meta']['uid'])
        result["rpc_name"] = rpc_name
        result["task_id"] = task_id
        result["run_id"] = self.run_id

        if not result['ok']:
            self._errors[task_id] = result.get('error')

        if (meta.get('log_results') and result['ok']) or not result['ok']:
            self.context.event_manager.fire_event("flows_node_finished", result)
        
        # logging output of the current step
        self._write_to_file(result, output_path)
        
        # stop flow if current task failed and it is not skippable
        self.consider_stopping_flow(task_id, result['ok'])

        log.info(f"Completed: {task_id}")

    def run(self):
        #### MAIN
        log.info("FLOW STARTED...")
        self.context.sio.emit("flow_started", {"msg": "Workflow is started", "run_id": self.run_id})

        steps_data = self.generate_steps_conf(self.tasks)
        for step, task_ids in steps_data.items():
            log.info(f"Step {step} started")
            
            # stop when task failed                
            if self._stop_flow:
                log.info("FLOW ABORTED")
                break
            
            threads = []
            for task_id in task_ids:
                task_config = self.tasks[task_id]
                p = Thread(target=FlowExecutor._execute_task, args=(self, self.project_id, task_id, task_config))
                p.start()
                threads.append(p)

            for thread in threads:
                thread.join()
            
            threads.clear()
            log.info(f"Step {step} finished")
        log.info(f"Flow execution DONE: {self.run_id}")

        # remove all files
        # current_dir = os.getcwd()
        # log.info(current_dir)
        # log.info(os.listdir(current_dir))
        # for f in os.listdir(current_dir):
        #     os.remove(os.path.join(current_dir, f))
        if self._errors:
            return False, self._errors

        result = self._read_results()
        return True, result.get('flowy_end')


    
