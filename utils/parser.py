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
        direct_parents = []
        task_data = self.front_tasks.get(task_id)

        if not task_data:
            return list(set(full_parents))

        # Get the connections for the current task
        connections = task_data.get("inputs", {}).get("input_1", {}).get("connections", [])

        # Extract the parent task IDs from the connections
        parent_task_ids = [connection["node"] for connection in connections]

        # Update the full parents list with all parent task IDs
        full_parents.extend(parent_task_ids)

        # Find the direct parents (those that are directly connected)
        direct_parents.extend(parent_task_ids)

        # Recursively find parents for each parent task
        for parent_id in parent_task_ids:
            parent_full, _ = self._find_parents(parent_id)
            full_parents.extend(parent_full)

        return list(set(full_parents)), list(set(direct_parents))

    def _find_parent_lists(self):
        for task_id in self.front_tasks:
            parents, direct_parents = self._find_parents(task_id)
            data = self.back_tasks.setdefault(task_id, {})
            data['step'] = len(parents) + 1
            data['parent_list'] = parents
            data['direct_parents'] = direct_parents
    

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
                names_mapping = {
                    "start": "flowy_start",
                    "end": "flowy_end"
                }
                name = self.front_tasks[task_id]['name']
                data['name'] = names_mapping.get(name)


    def _map_rpc_functions(self):
        # mapping = tasklib.get_tasks_to_rpc_mappings()
        from tools import flow_tools
        mapping = flow_tools._registry
        invalid_names = []
        for task_id, data in self.front_tasks.items():
            name = data['name']
            flow_meta = mapping.get(name)
            if not flow_meta:
                invalid_names.append(name)
            else:
                self.back_tasks[task_id] = {'flow_meta': flow_meta}
                # self.back_tasks[task_id]['rpc_name'] = flow_tools.get_rpc_name(flow_meta['uid'])

        if invalid_names:
            raise InvalidTaskNames("Invalid task names found", invalid_names)

    def parse(self):
        self._map_rpc_functions()
        self._populate_task_props()
        self._find_parent_lists()
        return self.back_config
