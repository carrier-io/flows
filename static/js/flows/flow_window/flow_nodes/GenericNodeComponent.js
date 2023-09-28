const GenericNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    data() {
        return {
            options: {
                properties_open: false,
                status: constants.node_statuses.idle
            }
        }
    },
    mounted() {
        load_node_data(this)
    },
    methods: {
    },
    watch: {
        'window.V.custom_data.selected_node': function(newValue) {
            if (this.node_id !== newValue) {
                this.options.properties_open = false
            }
        },
    },
    template: `
    <div class="d-flex flex-column"
        :class="{
            'flow_validation_error': options.validation_errors?.length,
            'flow_validation_error': options.status === window.constants.node_statuses.error,
            'flow_node_running': options.status === window.constants.node_statuses.running,
            'flow_node_success': options.status === window.constants.node_statuses.success,
        }"
    >
        <div class="d-flex align-items-center p-3">
            <div class="flex-grow-1">
                <span class="font-h6 text-capitalize">
                    {{ node_meta.display_name }}
                </span>
            </div>
            <div>
                <button class="btn btn-action btn-icon__xs"
                    @click="options.properties_open = !options.properties_open"
                >
                    <i class="icon__18x18 icon-settings"></i>
                </button>
            </div>
        </div>
        <div class="card flow_node_properties_container" 
            v-if="options.properties_open"
            :style="window.V.custom_data.properties_window_offset"
        >
            <div class="card-header d-flex">
                <div class="flex-grow-1">
                    <p class="font-h5 font-weight-bold text-capitalize">Properties</p>
                    <span class="font-h6 font-weight-bold text-capitalize">
                        {{ node_meta.display_name }}
                    </span>
                </div>
                <div>
                    <button class="btn btn-action btn-24"
                        @click="options.properties_open = false"
                    >
                        <i class="fa fa-times fa-xl"></i>
                    </button>
                </div>
                
            </div>
            <div class="card-body">
            </div>
        </div>
    </div>
    `
}