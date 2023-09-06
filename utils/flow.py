import re
import os
import re
import json
from pathlib import Path
from threading import Thread

from typing import Dict, List
from pylon.core.tools import log, web


class PreviousTaskFailed(Exception):
    "Raised when previous task is faield"


class Flow:
    def __init__(self, module, data):
        self.module = module
        self.context = module.context
        self.data = data
        self.project_id = self.data.pop('project_id', None)
        self.variables = self.data.get('variables', {})
        self.tasks = self.data.get('tasks', {})
        self.run_id = self.data['run_id']

    def _read_outputs(self, parents, direct_parent):
        prev_values = {}
        folder_path = os.path.join(os.getcwd(), self.run_id)
        for parent in parents:
            parent_path = os.path.join(folder_path, f"{parent}_out.json")
            file = open(parent_path, 'r')
            content = json.load(file)
            if direct_parent == parent and not content.get("ok"):
                raise PreviousTaskFailed("Previous task failed")
            name = self.tasks[parent]['name']
            prev_values[name] = content["result"] if content['ok'] else {}
            file.close()
        return prev_values

    @staticmethod
    def resolve_fields(payload, prev_context, var_context):
        variable_pattern = r"([a-zA-Z0-9_]+)"
        variables_pattern = r"{{variables\." + variable_pattern + r"}}"
        prev_pattern = r"{{nodes\['"+ variable_pattern + r"'\]\.?" + variable_pattern + r"}}"
        
        if isinstance(payload, dict):
            resolved_payload = {}
            for key, value in payload.items():
                resolved_value = Flow.resolve_fields(value, prev_context, var_context)
                resolved_payload[key] = resolved_value
            return resolved_payload
        
        elif isinstance(payload, list):
            resolved_payload = []
            for item in payload:
                resolved_item = Flow.resolve_fields(item, prev_context, var_context)
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

    def generate_steps_conf(self, data:Dict):
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

    def _execute_task(self, project_id, task_id, meta):
        log.info(f'Process started: {os.getpid()} -> {task_id}')
        folder_path = os.path.join(os.getcwd(), self.run_id)
        output_path = os.path.join(folder_path, f"{task_id}_out.json")
        prev_values = {}
        
        # loading rpc function object
        rpc_obj = getattr(self.context.rpc_manager.call, meta['rpc_name'])
        params = {'project_id': project_id}
        
        # loading previous tasks outputs
        try:
            prev_values = self._read_outputs(meta['parent_list'], meta['parent'])
        except PreviousTaskFailed as e:
            log.error(f"Process terminated: {os.getpid} -> {task_id}\nReason: {str(e)}")
            return

        # filling params from inputed data
        for param_name, original_value in meta['params'].items():
            # check for inferring input
            try:
                value = Flow.resolve_fields(original_value, prev_values, meta['variables'])
                params[param_name] = value
            except KeyError:
                error_msg = f"Failed to infer {param_name} for {original_value} in {task_id} task"
                log.error(error_msg)
                self.context.event_manager.fire_event("task_executed", json.dumps({
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
        result["rpc_name"] = meta["rpc_name"]
        result["task_id"] = task_id
        result["run_id"] = self.run_id
        self.context.event_manager.fire_event("task_executed", result)
        
        log.info(f"Completed: {task_id}")
        
        # logging output of the current step
        myfile = Path(output_path)
        myfile.touch(exist_ok=True)
        #
        with open(myfile, "w+") as out_file:
            json.dump(result, out_file, indent=4)

    def run_workflow(self):
        #### MAIN
        self.context.sio.emit("flow_started", {"msg": "Workflow is started", "run_id": self.run_id})
        output = self.data.pop('output')

        # creating folder for this flow run
        folder_path = os.path.join(os.getcwd(), self.run_id)
        os.makedirs(folder_path, exist_ok=True)

        steps_data = self.generate_steps_conf(self.tasks)
        for step, task_ids in steps_data.items():
            log.info(f"Step {step} started")
            processes = []
            for task_id in task_ids:
                task_config = self.tasks[task_id]
                task_config['variables'] = self.variables
                p = Thread(target=Flow._execute_task, args=(self, self.project_id, task_id, task_config))
                p.start()
                processes.append(p)

            for process in processes:
                process.join()
            
            log.info(f"Step {step} finished")

        # remove all files
        current_dir = os.getcwd()
        log.info(current_dir)
        log.info(os.listdir(current_dir))
        # for f in os.listdir(current_dir):
        #     os.remove(os.path.join(current_dir, f))


    def validate_flow(self):
        # validating global variables first
        errors = {}
        if self.variables:
            response = self.module.start_flow(self.project_id, self.variables)
            if not response['ok']:
                del response['ok']
                errors['variables'] = response
            else:
                self.variables = response['result']
        
        # Validating RPC functions
        # steps_data = self.generate_steps_conf(self.tasks)
        # for step, task_ids in steps_data.items():
        #     pass
        
        if errors:
            self.context.sio.emit("flow_errors", {"errors": errors, "run_id": self.run_id})