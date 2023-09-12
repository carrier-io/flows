const EvaluateNode = {
    props: ['node_meta', 'node_data', 'node_id'],
    components: {
        'FlowHandlersSection': Vue.markRaw(FlowHandlersSection)
    },
    data() {
        return {
            flow_handle_settings: {
                on_success: '',
                on_failure: 0,
                log_results: false
            },
            eval_input: '',
            output_type: null,
            options: {
                properties_open: false,
                selectedTabIndex: 0,
                tabs: ['Data', 'Logs'],
                logs: 'Logs will be here',
                output_types: constants.variable_types
            }
        }
    },
    async mounted() {
        load_node_data(this)

        if (!this.output_type) {
            this.output_type = this.options.output_types[0].value
        }
    },
    computed: {
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
    },
    template: `
    <div class="d-flex flex-column">
        <div class="d-flex p-3">
            <div class="flex-grow-1">
                <span class="font-h6 text-capitalize">
                    {{ node_meta.name }}
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
        
        <pre v-if="false" style="font-size: 7px">
            id: {{node_id}}
            <br/>
            {{$data}}
        </pre>
        
        <div class="card flow_node_properties_container" 
            v-if="options.properties_open"
            :style="window.V.custom_data.properties_window_offset"
        >
            <div class="card-header d-flex flex-column pb-2">
                <div class="d-flex">
                    <div class="flex-grow-1">
                        <p class="font-h5 font-weight-bold text-capitalize">Properties</p>
                        <span class="font-h6 font-weight-bold text-capitalize">
                            {{ node_meta.name }}
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
                
                <nav class="striped mt-2">
                    <div class="nav nav-tabs justify-content-center" role="tablist">
                        <a 
                            v-for="(t, i) in options.tabs"
                            class="nav-item nav-link cursor-pointer" 
                            :class="{'active': i === options.selectedTabIndex}"
                            :key="i"
                            @click="options.selectedTabIndex = i"
                        >{{ t }}</a>
                    </div>
                </nav>
                
            </div>
            
    
            <div class="card-body pt-2 tab-content overflow-auto" style="border-top: 1px solid var(--gray200)">
                <div
                    class="tab-pane fade flex-grow-1 flex-column"
                    role="tabpanel"
                    :class="{'show': options.selectedTabIndex === 0, 'active': options.selectedTabIndex === 0}"
                >
                    <FlowHandlersSection v-model="flow_handle_settings"></FlowHandlersSection>
                
                    <div class="mt-2">
                        <div class="flex-grow-1">
                            <span class="font-h5 font-bold">Input</span> <i class="icon__16x16 icon-info__16"></i>
                        </div>
                        
                        <textarea class="form-control"
                            rows="7"
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
                </div>
                
                
                <div
                    class="tab-pane fade flex-grow-1 flex-column"
                    role="tabpanel"
                    :class="{'show': options.selectedTabIndex === 1, 'active': options.selectedTabIndex === 1}"
                >
                    <pre class="form-control w-100 h-100 overflow-auto">{{ options.logs }}</pre>
                </div>
                    
            </div>
        </div>
    </div>
    `
}
