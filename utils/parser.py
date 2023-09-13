from tools import tasklib
from pylon.core.tools import log


class InvalidTaskNames(Exception):
    def __init__(self, message, invalid_names):
        super().__init__(message)
        self.invalid_names = invalid_names



class FlowParser:
    def __init__(self, front_config):
        self.front_config: dict = front_config
        self.back_tasks = {}
        self.back_config = {'tasks': self.back_tasks}
        self.front_tasks: dict = front_config['drawflow']['Home']['data']


    def _find_parents(self, task_id):
        full_parents = []
        task_data = self.front_tasks.get(task_id)
        
        if not task_data:
            return list(set(full_parents))
        
        # Get the connections for the current task
        connections = task_data.get("inputs", {}).get("input_1", {}).get("connections", [])

        # Extract the parent task IDs from the connections
        parent_task_ids = [connection["node"] for connection in connections]

        # Update the full parents list with all parent task IDs
        full_parents.extend(parent_task_ids)

        # Recursively find parents for each parent task
        for parent_id in parent_task_ids:
            parent_full = self._find_parents(parent_id)
            full_parents.extend(parent_full)

        return list(set(full_parents))


    def _find_parent_lists(self):
        for task_id in self.front_tasks:
            parents  = self._find_parents(task_id)
            data = self.back_tasks.setdefault(task_id, {})
            data['step'] =  len(parents) + 1
            data['parent_list'] = parents
    

    def _populate_task_props(self):
        for task_id, data in self.back_tasks.items():
            front_data = self.front_tasks[task_id]['data']
            data['params'] = {
                param: value 
                for param, value in front_data.items()
                if not param == "flow_handle_settings" 
            }
            front_settings = front_data.get('flow_handle_settings')
            if front_settings:
                data['name'] = front_settings['on_success']
                data['on_failure'] = front_settings['on_failure']
                data['log_results'] = front_settings['log_results']
            else:
                name = self.front_tasks[task_id]['name']
                data['name'] = "flowy_start" if name == "start" else ""
                

    def _map_rpc_functions(self):
        mapping = tasklib.get_tasks_to_rpc_mappings()
        invalid_names = []
        for task_id, data in self.front_tasks.items():
            name = data['name']
            rpc_name = mapping.get(name)
            if not rpc_name:
                invalid_names.append(name)
            
            self.back_tasks[task_id] = {}
            self.back_tasks[task_id]['rpc_name'] = rpc_name

        if invalid_names:
            raise InvalidTaskNames("Invalid task names found", invalid_names)
    

    def parse(self):
        self._map_rpc_functions()
        self._populate_task_props()
        self._find_parent_lists()
        return self.back_config