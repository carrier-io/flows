const constants = {
    variable_types: [
        {value: 'string', label: 'str'},
        {value: 'integer', label: 'int'},
        {value: 'float', label: 'float'},
        {value: 'json', label: 'json'},
        {value: 'boolean', label: 'bool'},
    ],

    on_failure_options: [
        {value: 0, label: 'Stop Flow'},
        {value: 1, label: 'Ignore'},
    ]
}

const load_node_data = vue_component_instance => {
    delete vue_component_instance.node_data.options
    Object.assign(vue_component_instance.$data, vue_component_instance.node_data || {})
}
