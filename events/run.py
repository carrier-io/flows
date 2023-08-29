import os
import json
from pathlib import Path
from threading import Thread

from pylon.core.tools import log, web



class Event:
    @web.event("task_executed")
    def _task_executed(self, context, event, payload):
        context.sio.emit("task_executed", payload)

    @web.event("run_workflow")
    def _run_workflow(self, context, event, data):
        def _execute_task(self, project_id, task_id, meta):
            log.info(f'Process started: {os.getpid()} -> {task_id}')
            output_path = f"{task_id}_out.json"
            context = None
            
            # loading rpc function object
            rpc_obj = getattr(self.context.rpc_manager.call, meta['rpc_name'])
            params = {'project_id': project_id}
            
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
                log.info(f"VALUE: {value}")

                if value and type(value) == str and "prev." in value: 
                    name = value.split('.')[1]
                    prev_result = context["result"]
                    value = prev_result.get(name)

                    if not value:
                        log.error(f"Failed to infer {name} for {task_id}")
                        self.context.event_manager.fire_event("task_executed", json.dumps({
                            "ok": False,
                            "error": f"Failed to infer {name} for {task_id}",
                            "task_id": task_id,
                        }))
                        continue

                    # 
                elif value and type(value) == str and "variables." in value:
                    name = value.split('.')[1]
                    value = meta['variables'].get(name)

                    if not value:
                        log.error(f"Failed to infer {name} for {task_id}")
                        self.context.event_manager.fire_event("task_executed", json.dumps({
                            "ok": False,
                            "error": f"Failed to infer {name} for {task_id}",
                            "task_id": task_id,
                        }))
                        continue

                if "." in param_name and not \
                    ("prev." in param_name and "variables." in param_name):
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

            # Sending info regarding task completion
            result["rpc_name"] = meta["rpc_name"]
            result["task_id"] = task_id
            self.context.event_manager.fire_event("task_executed", json.dumps(result))
            
            log.info(f"Completed: {task_id}")
            
            # logging output of the current step
            myfile = Path(output_path)
            myfile.touch(exist_ok=True)
            #
            with open(myfile, "w+") as out_file:
                json.dump(result, out_file, indent=4)

        #### MAIN
        context.sio.emit("flow_started", {"msg": "Workflow is started"})
        output = data.pop('output')
        project_id = data.pop('project_id', None)
        variables = data.pop('variables', {})
        tasks = data.pop('tasks')

        steps_data = self.generate_steps_conf(tasks)
        for step, task_ids in steps_data.items():
            log.info(f"Step {step} started")
            processes = []
            for task_id in task_ids:
                task_config = tasks[task_id]
                task_config['variables'] = variables
                p = Thread(target=_execute_task, args=(self, project_id, task_id, task_config))
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