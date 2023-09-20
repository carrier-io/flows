const EndNode = {
    props: ['node_meta', 'node_data', 'node_id'],
    data() {
        return {
            eval_input: '',
            output_type: null,
            options: {
                properties_open: false,
                output_types: constants.variable_types,
                status: constants.node_statuses.idle,
                result: null,
                validation_errors: []
            }
        }
    },
    mounted() {
        load_node_data(this)
        window.socket.on(constants.sio_events.flow_started, () => this.options.result = null)
        if (!this.output_type) {
            this.output_type = this.options.output_types[0].value
        }
    },
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
    },
    watch: {
        'window.V.custom_data.selected_node': function(newValue) {
            if (this.node_id !== newValue) {
                this.options.properties_open = false
            }
        },
        'options.properties_open': function (newValue) {
            if (newValue) {
                this.refresh_pickers()
            }
        },
        'options.validation_errors': function (newValue) {
            if (newValue.length) {
                this.options.status = constants.node_statuses.error
                this.options.result = newValue
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
            
            <div class="card-body d-flex flex-column">
                <div class="mt-2">
                    <div class="flex-grow-1">
                        <span class="font-h5 font-bold">Input</span> <i class="icon__16x16 icon-info__16"></i>
                    </div>
                        
                    <textarea class="form-control"
                        rows="3"
                        v-model="eval_input"
                    />
                </div>
                
                <div class="mt-2 d-flex flex-column w-100">
                    <span class="font-h5 font-bold">
                        Output Type
                    </span>
                    <select class="selectpicker" data-style="select-secondary" 
                        v-model="output_type"
                    >
                        <option v-for="i in options.output_types" :value="i.value" :key="i.value">
                            {{ i.label }}
                        </option>
                    </select>
                </div>
                
                <div class="mt-2 flex-grow-1 d-flex flex-column">
                    <span class="font-h5 font-bold">Result</span>
<!--                    <pre class="form-control flex-grow-1 overflow-auto">{{ options.result }}</pre>-->
                    <pre class="form-control flex-grow-1 overflow-auto" v-html="options.result"></pre>
                </div>
            </div>
        </div>
    </div>
    `
}