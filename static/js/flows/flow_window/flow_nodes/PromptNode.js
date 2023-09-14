const PromptNode = {
    props: ['node_meta', 'node_data', 'node_id'],
    components: {
        'FlowHandlersSection': Vue.markRaw(FlowHandlersSection),
        'VariablesInput': Vue.markRaw(VariablesInput),
        'ConnectedSlider': Vue.markRaw(ConnectedSlider),
    },
    data() {
        return {
            flow_handle_settings: {
                on_success: '',
                on_failure: 0,
                log_results: false
            },
            prompt_name: null,
            prompt_id: null,
            variables: [],
            prompt_input: '',
            integration_uid: null,
            model_settings: {},
            options: {
                properties_open: false,
                selectedTabIndex: 0,
                tabs: ['Data', 'Advanced', 'Logs'],
                logs: 'Logs will be here',
                is_loading: false,
                tags: [],
            }
        }
    },
    async mounted() {
        load_node_data(this)

        this.prompts === undefined && await this.fetchPrompts()
        this.refresh_pickers()
    },
    computed: {
        prompts() {
            return V.custom_data.prompts
        },
        ai_integrations() {
            return V.custom_data.ai_integrations
        },
        promptsList() {
            return this.prompts ? Object.keys(this.prompts) : []
        },
        promptVersions() {
            return this.prompts && this.prompts[this.prompt_name] || []
        },
        debugValue() {
            const val = {...this.$data}
            delete val.options
            return val
        }
    },
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
        async fetchPrompts() {
            this.options.is_loading = true
            const api_url = V.build_api_url('prompts', 'flows')
            const resp = await fetch(api_url + '/' + V.project_id)
            this.options.is_loading = false
            if (resp.ok) {
                V.custom_data.prompts = await resp.json()
            } else {
                showNotify('ERROR', 'Error fetching prompts')
            }
            this.refresh_pickers()
        },
        async fetchIntegrations() {
            this.options.is_loading = true
            const api_url = V.build_api_url('integrations', 'integrations')
            const resp = await fetch(api_url + '/' + V.project_id + '?section=ai')
            this.options.is_loading = false
            if (resp.ok) {
                V.custom_data.ai_integrations = await resp.json()
            } else {
                showNotify('ERROR', 'Error fetching ai integrations')
            }
            this.refresh_pickers()
        },
        async fetchPromptDetails(prompt_id) {
            this.options.is_loading = true
            const api_url = V.build_api_url('prompts', 'prompt')
            const resp = await fetch(api_url + '/' + V.project_id + '/' + prompt_id)
            this.options.is_loading = false
            if (resp.ok) {
                return await resp.json()
            } else {
                showNotify('ERROR', 'Error fetching prompt details for prompt ' + prompt_id)
            }
        },
    },
    watch: {
        'window.V.custom_data.selected_node': function (newValue) {
            if (this.node_id !== newValue) {
                this.options.properties_open = false
            }
        },
        'options.properties_open': function (newValue) {
            if (newValue) {
                this.refresh_pickers()
            }
        },
        prompt_name(newValue) {
            // if (!this.node_data.prompt_id) {
                const new_prompt_id = this.promptVersions[0]?.id || null
            if (new_prompt_id) {
                this.prompt_id = new_prompt_id
                // double refresh here because stupid selectpicker won't work another way
                this.refresh_pickers()
                this.refresh_pickers()
            }
            // }
        },
        async prompt_id(newValue) {
            const prompt_details = newValue ? await this.fetchPromptDetails(newValue) : {}
            const {variables, test_input, tags, integration_uid, model_settings} = prompt_details

            this.variables = [
                ...this.variables.filter(i => i.prompt_id === undefined),
                ...variables.map(({name, value}) => ({
                    name,
                    type: constants.variable_types[0].value,
                    value,
                    prompt_id: newValue
                }))
            ]
            if (!this.node_data.prompt_input) {
                this.prompt_input = test_input
            }
            this.options.tags = tags.map(({tag, color}) => ({tag, color}))
            if (!this.node_data.integration_uid) {
                this.integration_uid = integration_uid
            }

            if (!this.node_data.model_settings) {
                this.model_settings = model_settings
            }

            this.refresh_pickers()

            $('#debug2').val(JSON.stringify(prompt_details, null, 2))
        },
        'options.selectedTabIndex': async function (newValue) {
            console.log('selected tab ', newValue)
            if (newValue === 1) {
                this.ai_integrations === undefined && await this.fetchIntegrations()
                this.refresh_pickers()
            }
        },
    },
    template: `
    <div class="d-flex flex-column">
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
        <div class="d-flex flex-column" style="border-top: 1px solid var(--gray200)">
            <div class="d-flex flex-column p-3">
                <select class="selectpicker" data-style="select-secondary" 
                    v-model="prompt_name"
                >
                    <option v-for="i in promptsList" :value="i" :key="i">
                        {{ i }}
                    </option>
                </select>
                
                <label class="d-flex align-items-center">
                    <span class="font-h6">Version: </span>
                    <select class="selectpicker flex-grow-1 ml-2" data-style="select-secondary" 
                        v-model="prompt_id"
                        :disabled="!prompt_name"
                    >
                        <option v-for="i in promptVersions" :value="i.id" :key="i.id">
                            {{ i.version }}
                        </option>
                    </select>
                </label>
            </div>
        </div>
        
        <pre v-if="false" style="font-size: 7px">
            id: {{node_id}}
            <br/>
            {{debugValue}}
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
                    
                    <VariablesInput v-model="variables" class="mt-2"></VariablesInput>
                
                    <div class="mt-2">
                        <div class="flex-grow-1">
                            <span class="font-h5 font-bold">Input</span> <i class="icon__16x16 icon-info__16"></i>
                        </div>
                        <textarea class="form-control"
                            rows="3"
                            v-model="prompt_input"
                        />
                    </div>
                    
                    <div class="mt-2">
                        <div class="flex-grow-1">
                            <span class="font-h5 font-bold">Tags</span>
                        </div>
                        <span class="btn btn-xs btn-painted rounded-pill mb-1 mr-1"
                            v-for="tag in options.tags"
                            style="max-width: 100px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; cursor: default"
                            :style="{'--text-color': tag.color, '--brd-color': tag.color}"
                        >
                            {{ tag.tag }}
                        </span>
                    </div>
                </div>
                
                <div
                    class="tab-pane fade flex-grow-1 flex-column"
                    role="tabpanel"
                    :class="{'show': options.selectedTabIndex === 1, 'active': options.selectedTabIndex === 1}"
                >
                    <label class="mt-2 d-flex flex-column">
                        <span class="font-h5 font-weight-bold">Integration</span>
                        <select class="selectpicker bootstrap-select__b" 
                            v-model="integration_uid"
                        >
                            <option 
                                v-for="i in ai_integrations" 
                                :value="i.uid"
                            >
                                {{ i?.config?.name }}
                            </option>
                        </select>
                    </label>
                    
                    <div class="mt-2">
                        <span class="font-h5 font-weight-bold">Temperature</span>
                        <ConnectedSlider 
                            v-if="options.selectedTabIndex === 1"
                            v-model="model_settings.temperature"
                            :min="0"
                            :max="1"
                            :step="0.01"
                        ></ConnectedSlider>
                    </div>
                    
                    <div class="mt-2">
                        <span class="font-h5 font-weight-bold">Token limit</span>
                        <ConnectedSlider 
                            v-if="options.selectedTabIndex === 1"
                            v-model="model_settings.max_tokens"
                            :min="1"
                            :max="32000"
                            :step="1"
                            :format="window.wNumb({decimals: 0})"
                        ></ConnectedSlider>
                    </div>
                    
                    <div class="mt-2"
                        v-if="options.selectedTabIndex === 1 && model_settings.top_k"
                    >
                        <span class="font-h5 font-weight-bold">Top-K</span>
                        <ConnectedSlider 
                            v-model="model_settings.top_k"
                            :min="0"
                            :max="100"
                            :step="1"
                        ></ConnectedSlider>
                    </div>
                    
                    <div class="mt-2"
                        v-if="options.selectedTabIndex === 1 && model_settings.top_p"
                    >
                        <span class="font-h5 font-weight-bold">Top-P</span>
                        <ConnectedSlider 
                            v-model="model_settings.top_p"
                            :min="0"
                            :max="1"
                            :step="0.01"
                        ></ConnectedSlider>
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
