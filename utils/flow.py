import re
import os
import json
from pathlib import Path
from queue import Empty
from threading import Thread, Lock

from typing import Dict, List
from pylon.core.tools import log

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

    def __init__(self, module, data):
        log.info('initializing FlowExecutor with %s, %s', module, data)
        self.module = module
        log.info('initializing FlowExecutor module')
        self.context = module.context
        log.info('initializing FlowExecutor context')
        self.data = data
        log.info('initializing FlowExecutor data')
        self.project_id = self.data.pop('project_id', None)
        log.info('initializing FlowExecutor project_id')
        self.variables = self.data.get('variables', {})
        log.info('initializing FlowExecutor variables')
        self.tasks = self.data.get('tasks', {})
        log.info('initializing FlowExecutor tasks')
        self.run_id = self.data['run_id']
        # # data
        # data = {'drawflow': {'Home': {'data': {'2': {'id': 2, 'name': 'start', 'data': {
        #     'variables': [{'name': 'cutoff', 'type': 'float', 'value': '0.4'}]}, 'class': 'flow_node', 'html': 'start',
        #                                              'typenode': 'vue', 'inputs': {}, 'outputs': {'output_1': {}},
        #                                              'pos_x': 113, 'pos_y': 15}}}}}
        log.info('initializing FlowExecutor run_id')
        log.info('initializing FlowExecutor Done %s, %s', module, data)

    def _read_outputs(self, parents):
        prev_values = {}

        folder_path = OUTPUT_FOLDER.joinpath(self.run_id)
        folder_path.mkdir(exist_ok=True)
        for parent in parents:
            parent_path = os.path.join(folder_path, f"{parent}_out.json")
            skip = self.tasks.get(parent, {}).get('on_failure') == self.SKIP_CHAR

            if not os.path.exists(parent_path):
                if skip:
                    continue
                raise PreviousTaskFailed("Previous task failed")

            file = open(parent_path, 'r')
            content = json.load(file)

            if not content.get("ok"):
                if skip:
                    continue
                raise PreviousTaskFailed("Previous task failed")

            name = self.tasks[parent]['name']
            prev_values[name] = content["result"]
            file.close()
        return prev_values

    @staticmethod
    def resolve_fields(payload, prev_context, var_context):
        variable_pattern = r"([a-zA-Z0-9_]+)"
        variables_pattern = r"{{variables\." + variable_pattern + r"}}"
        prev_pattern = r"{{nodes\['" + variable_pattern + r"'\]\.?" + variable_pattern + r"?}}"

        if isinstance(payload, dict):
            resolved_payload = {}
            for key, value in payload.items():
                resolved_value = FlowExecutor.resolve_fields(value, prev_context, var_context)
                resolved_payload[key] = resolved_value
            return resolved_payload

        elif isinstance(payload, list):
            resolved_payload = []
            for item in payload:
                resolved_item = FlowExecutor.resolve_fields(item, prev_context, var_context)
                resolved_payload.append(resolved_item)
            return resolved_payload

        elif isinstance(payload, str):
            if match := re.fullmatch(variables_pattern, payload):
                name = match.group(1)
                value = var_context[name]
                return value

            elif match := re.fullmatch(prev_pattern, payload):
                task_name = match.group(1)
                attribute_name = match.group(2)
                context = prev_context[task_name]
                value = context if not attribute_name else context[attribute_name]
                return value

        return payload

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

    def _execute_task(self, project_id, task_id, meta: dict):
        log.info(f'Process started: {os.getpid()} -> {task_id}')
        folder_path = OUTPUT_FOLDER.joinpath(self.run_id)
        folder_path.mkdir(exist_ok=True)
        output_path = os.path.join(folder_path, f"{task_id}_out.json")
        prev_values = {}

        # loading rpc function object
        rpc_name = flow_tools.get_rpc_name(meta['flow_meta']['uid'])
        rpc_obj = getattr(self.context.rpc_manager.timeout(10), rpc_name)
        params = {'project_id': project_id}

        # loading previous tasks outputs
        try:
            prev_values = self._read_outputs(meta['parent_list'])
        except PreviousTaskFailed as e:
            log.error(f"Process terminated: {os.getpid()} -> {task_id}\nReason: {str(e)}")
            return

        # filling params from inputed data
        for param_name, original_value in meta['params'].items():
            # check for inferring input
            try:
                value = FlowExecutor.resolve_fields(original_value, prev_values, self.variables)
                params[param_name] = value
            except KeyError as e:
                error_msg = f"Failed to infer {param_name} for {original_value} in {task_id} task"
                log.error(error_msg)
                self.context.event_manager.fire_event("flows_node_finished", json.dumps({
                    "ok": False,
                    "error": error_msg,
                    "task_id": task_id,
                    "run_id": self.run_id
                }))
                return

        log.info('---------------------------')
        log.info(f"RPC: {rpc_obj}")
        log.info(f"PARAMS: {params}")
        # Executing rpc function
        result = rpc_obj(**params)

        # Sending info regarding task completion
        rpc_name = flow_tools.get_rpc_name(meta['flow_meta']['uid'])
        result["rpc_name"] = rpc_name
        result["task_id"] = task_id
        result["run_id"] = self.run_id
        if (meta.get('log_results') and result['ok']) or not result['ok']:
            self.context.event_manager.fire_event("flows_node_finished", result)

        log.info(f"Completed: {task_id}")

        # logging output of the current step
        myfile = Path(output_path)
        myfile.touch(exist_ok=True)
        #
        with open(myfile, "w+") as out_file:
            json.dump(result, out_file, indent=4)

    def run(self):
        #### MAIN
        log.info("FLOW STARTED...")
        self.context.sio.emit("flow_started", {"msg": "Workflow is started", "run_id": self.run_id})
        output = self.data.pop('output', None)

        # creating folder for this flow run
        folder_path = OUTPUT_FOLDER.joinpath(self.run_id)
        folder_path.mkdir(exist_ok=True)

        steps_data = self.generate_steps_conf(self.tasks)
        for step, task_ids in steps_data.items():
            log.info(f"Step {step} started")
            threads = []
            for task_id in task_ids:
                task_config = self.tasks[task_id]
                p = Thread(target=FlowExecutor._execute_task, args=(self, self.project_id, task_id, task_config))
                p.start()
                threads.append(p)

            for thread in threads:
                thread.join()

            log.info(f"Step {step} finished")

        # remove all files
        # current_dir = os.getcwd()
        # log.info(current_dir)
        # log.info(os.listdir(current_dir))
        # for f in os.listdir(current_dir):
        #     os.remove(os.path.join(current_dir, f))
