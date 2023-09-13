from pylon.core.tools import web
from pathlib import Path
from multiprocessing import Process
import json
import os
from pylon.core.tools import web  # pylint: disable=E0611,E0401
from pylon.core.tools import log  # pylint: disable=E0611,E0401

from tools import rpc_tools  # pylint: disable=E0401
from typing import Dict, List


class RPC:
    @web.rpc("flows_run_flow")
    @rpc_tools.wrap_exceptions(RuntimeError)
    def run_flow(self, data: dict):
        def _execute_task(self, task_id, meta):
            log.info(f'Process started: {os.getpid()} -> {task_id}')
            output_path = f"{task_id}_out.json"
            context = None
            
            # loading rpc function object
            log.info(meta['rpc_name'])
            rpc_obj = getattr(self.context.rpc_manager.call, meta['rpc_name'])
            params = {}
            
            # loading previous output
            if meta['parent']:
                file = open(f"{meta['parent']}_out.json", 'r')
                context = json.load(file)
                file.close()
            
            # terminate workflow if previous step failed
            if context and not context['ok']:
                log.error(f"Process terminated: {os.getpid} -> {task_id}")
                return

            # filling params from inputed data
            for param_name, param_prop in meta['params'].items():
                value = param_prop['value']
                # check for inferring input
                if value == "infer_from_context" and context: 
                    name = param_name.split('.')[1] if "." in param_name else param_name
                    value = context.get(name)
                    # 
                    if not value:
                        log.error(f"Failed to infer {name} for {task_id}")
                        self.context.event_manager.fire_event("flows_node_finished", json.dumps({
                            "ok": False,
                            "error": f"Failed to infer {name} for {task_id}",
                            "task_id": task_id,
                        }))
                        continue

                if "." in param_name:
                    names = param_name.split('.')
                    if names[0] not in params:
                        params[names[0]] = {names[1]: value}
                    else:
                        params[names[0]][names[1]] = value
                    continue
                params[param_name] = value


            log.info('---------------------------')
            log.info(f"RPC: {rpc_obj}")
            log.info(f"PARAMS: {params}")
            # Executing rpc function
            result = rpc_obj(**params)
            log.info('=======================================')

            # Sending info regarding task completion
            result["rpc_name"] = meta["rpc_name"]
            result["task_id"] = task_id
            self.context.event_manager.fire_event("flows_node_finished", json.dumps(result))
            
            log.info(f"Completed: {task_id}")
            
            # logging output of the current step
            myfile = Path(output_path)
            myfile.touch(exist_ok=True)
            #
            with open(myfile, "w+") as out_file:
                json.dump(result, out_file, indent=4)

        #### MAIN
        output = data.pop('output')
        tasks = data.pop('tasks')
        steps_data = self.generate_steps_conf(tasks)
        for step, task_ids in steps_data.items():
            log.info(f"Step {step} started")
            processes = []
            for task_id in task_ids:
                p = Process(target=_execute_task, args=(self, task_id, tasks[task_id]))
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
