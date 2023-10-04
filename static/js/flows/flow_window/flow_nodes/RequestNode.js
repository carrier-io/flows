const RequestNode = {
    props: ['node_meta', 'node_data', 'node_id'],
    components: {
        'FlowHandlersSection': Vue.markRaw(FlowHandlersSection),
        "TextVariablesInput": Vue.markRaw(TextVariablesInput),
    },
    data() {
        return {
            flow_handle_settings: {
                on_success: '',
                on_failure: constants.on_failure_options[0].value,
                log_results: false
            },
            url: "",
            action: "",
            headers: [],
            body: "",
            request_type: null,
            output_type: "string",
            options: {
                properties_open: false,
                selectedTabIndex: 0,
                tabs: ['Data', 'Advanced', 'Logs'],
                logs: '',
                status: constants.node_statuses.idle,
                request_types: [
                    { 'value': "text", 'label': 'TEXT' },
                    { 'value': "json", 'label': 'JSON' },
                ],
                actions: [
                    { 'value': 'get', 'label': 'GET' },
                    { 'value': 'post', 'label': 'POST' },
                    { 'value': 'put', 'label': 'PUT' },
                    { 'value': 'patch', 'label': 'PATCH' },
                    { 'value': 'delete', 'label': 'DELETE' },
                ],
                output_types: constants.variable_types
            }
        }
    },
    async mounted() {
        load_node_data(this)

        if (!this.request_type) {
            this.request_type = this.options.request_types[0].value
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
                            <span class="font-h5 font-bold">Url</span> <i class="icon__16x16 icon-info__16"></i>
                        </div>
                        
                        <input type="text" class="form-control w-100"
                            v-model="url"
                            placeholder="Url"

                        />
                    </div>

                    <div class="mt-2 d-flex flex-column w-100">
                        <span class="font-h5 font-bold">
                            HTTP Actions
                        </span>
                        <select class="selectpicker" data-style="select-secondary" 
                            v-model="action"
                        >
                            <option v-for="i in options.actions" :value="i.value" :key="i.value">
                                {{ i.label }}
                            </option>
                        </select>
                    </div>
                    
                    <div class="mt-2 d-flex flex-column w-100">
                        <span class="font-h5 font-bold">
                            Request Type
                        </span>
                        <select class="selectpicker" data-style="select-secondary" 
                            v-model="request_type"
                        >
                            <option v-for="i in options.request_types" :value="i.value" :key="i.value">
                                {{ i.label }}
                            </option>
                        </select>
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
                    <TextVariablesInput
                        title="Headers"
                        v-model="headers"
                        class="mt-2"
                    ></TextVariablesInput>

                    <div class="mt-2">
                        <div class="flex-grow-1">
                            <span class="font-h5 font-bold">Body</span> <i class="icon__16x16 icon-info__16"></i>
                        </div>
                        
                        <textarea class="form-control"
                            rows="7"
                            v-model="body"
                        />
                    </div>
                </div>
                
                <div
                    class="tab-pane fade flex-grow-1 flex-column"
                    role="tabpanel"
                    :class="{'show': options.selectedTabIndex === 2, 'active': options.selectedTabIndex === 2}"
                >
                    <pre class="form-control w-100 h-100 overflow-auto">{{ options.logs }}</pre>
                </div>
                    
            </div>
        </div>
    </div>
    `
}
