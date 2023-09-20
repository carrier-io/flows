window.constants = {
    variable_types: [
        {value: 'string', label: 'str'},
        {value: 'integer', label: 'int'},
        {value: 'float', label: 'float'},
        {value: 'json', label: 'json'},
        {value: 'boolean', label: 'bool'},
    ],

    on_failure_options: [
        {value: 'stop', label: 'Stop Flow'},
        {value: 'ignore', label: 'Ignore'},
    ],

    node_statuses: {
        idle: 'idle',
        running: 'running',
        error: 'error',
        success: 'success'
    },

    sio_events: {
        flow_started: 'flows_flow_started',
        node_finished: 'flows_node_finished',
        flow_finished: 'flows_flow_finished',
        evaluation_extracted: 'flows_evaluation_extracted',
        evaluation_transformed: 'flows_evaluation_transformed',
    }

}

const load_node_data = vue_component_instance => {
    delete vue_component_instance.node_data.options
    Object.assign(vue_component_instance.$data, vue_component_instance.node_data || {})
}
