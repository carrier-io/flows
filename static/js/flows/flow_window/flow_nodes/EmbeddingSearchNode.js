const EmbeddingSearchNode = {
    props: ['node_meta', 'node_data', 'node_id'],
    components: {
        'FlowHandlersSection': Vue.markRaw(FlowHandlersSection)
    },
    data() {
        return {
            flow_handle_settings: {
                on_success: '',
                on_failure: constants.on_failure_options[0].value,
                log_results: false
            },
            embedding_id: null,
            cutoff: 0.6,
            top_k: 3,
            search_query: '',
            input_type: 'text',
            text_delimiter: 'newline',
            options: {
                properties_open: false,
                sliderCutoff: undefined,
                sliderTopK: undefined,
                available_input_types: ['text', 'json'],
                selectedTabIndex: 0,
                tabs: ['Data', 'Advanced', 'Logs'],
                logs: '',
                status: constants.node_statuses.idle,
            }
        }
    },
    async mounted() {
        load_node_data(this)

        this.embeddings === undefined && await this.fetchEmbeddings()
        this.refresh_pickers()
    },
    computed: {
        selected_node() {
            return V.custom_data.selected_node
        },
        embeddings() {
            return V.custom_data.embeddings
        },
        selectedEmbedding() {
            return this.embeddings.find(i => i.id === this.embedding_id)
        }
    },
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
        async fetchEmbeddings() {
            const api_url = V.build_api_url('embeddings', 'embedding')
            const resp = await fetch(api_url + '/' + V.project_id)
            if (resp.ok) {
                V.custom_data.embeddings = await resp.json()
            } else {
                showNotify('ERROR', 'Error fetching embeddings')
            }
            this.refresh_pickers()
        },
        initSliders() {
            this.options.sliderCutoff = noUiSlider.create(this.$refs.sliderCutoff, {
                start: this.cutoff,
                connect: 'lower',
                range: {
                    'min': 0,
                    'max': 1
                },
                step: 0.01,
            })
            this.options.sliderCutoff.on('update', (values, handle) => {
                this.cutoff = values[0]
            })

            this.options.sliderTopK = noUiSlider.create(this.$refs.sliderTopK, {
                start: this.top_k,
                connect: 'lower',
                range: {
                    'min': 1,
                    'max': 20
                },
                step: 1,
            })
            this.options.sliderTopK.on('update', (values, handle) => {
                this.top_k = parseInt(values[0])
            })
        },
        handleFormatInput() {
            try {
                const json = JSON.parse(this.search_query)
                this.search_query = JSON.stringify(json, null, 2)
                showNotify('INFO', 'Prettified')
            } catch (e) {
                showNotify('ERROR', 'Input value is not a valid json')
            }
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
                this.$nextTick(this.initSliders)
                this.refresh_pickers()
            }
        },
        input_type(newValue) {
            newValue === 'text' && this.refresh_pickers()
        }
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
        <div class="d-flex flex-column" style="border-top: 1px solid var(--gray200)">
            <div class="d-flex flex-column p-3">
                <select class="selectpicker" data-style="select-secondary" 
                    v-model="embedding_id"
                >
                    <option v-for="i in embeddings" :value="i.id" :key="i.id">
                        {{ i.library_name }}
                    </option>
                </select>
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
                        <span class="font-h5 font-weight-bold">Cut-off score</span>
                        <div class="d-flex">
                            <div ref="sliderCutoff" class="flex-grow-1"></div>
                            <div class="ml-3">
                                <input type="number" class="form-control" max="1" min="0" step="0.1"
                                       v-model="cutoff"
                                       @change="options.sliderCutoff.set($event.target.value)"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-2">
                        <span class="font-h5 font-weight-bold">Top-K</span>
                        <div class="d-flex">
                            <div ref="sliderTopK" class="flex-grow-1"></div>
                            <div class="ml-3">
                                <input type="number" class="form-control" max="20" min="0" step="1" 
                                    v-model="top_k"
                                    @change="options.sliderTopK.set($event.target.value)"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-2">
                        <div class="flex-grow-1">
                            <span class="font-h5 font-bold">Search query</span> <i class="icon__16x16 icon-info__16"></i>
                        </div>
                        <div class="d-flex align-items-end mb-1">
    
                            <div class="d-flex flex-column flex-grow-1 max-w-2/3">
                                <span class="font-h6">
                                    Type
                                </span>
                                <select class="selectpicker bootstrap-select__b bootstrap-select__b-sm" 
                                    v-model="input_type"
                                >
                                    <option 
                                        v-for="i in options.available_input_types" 
                                        :value="i"
                                    >
                                        {{ i }}
                                    </option>
                                </select>
                            </div>
                        
                            <div class="d-flex ml-2">
                                <div v-if="input_type === 'text'" class="d-flex flex-column w-100">
                                    <span class="font-h6"
                                        v-if="input_type === 'text'"
                                    >
                                        Delimiter
                                    </span>
                                    <select class="selectpicker bootstrap-select__b bootstrap-select__b-sm" 
                                        
                                        v-model="text_delimiter"
                                    >
                                        <option value="newline">newline</option>
                                        <option value=",">,</option>
                                    </select>
                                </div>
                                    
                                
                                <button class="btn btn-secondary"
                                    v-if="input_type === 'json'"
                                    @click="handleFormatInput"
                                >
                                    Format JSON
                                </button>
                            </div>
                            
                        
                        </div>
                        
                        <textarea class="form-control"
                            rows="5"
                            v-model="search_query"
                        />
                    </div>
                </div>
                
                <div
                    class="tab-pane fade flex-grow-1 flex-column"
                    role="tabpanel"
                    :class="{'show': options.selectedTabIndex === 1, 'active': options.selectedTabIndex === 1}"
                >
                    <div class="flex-column">
                        <div class="font-h6 text-gray-500 text-uppercase">
                            Data Type
                        </div>
                        <div>
                            {{ selectedEmbedding?.source_extension || '-' }}
                        </div>
                    </div>
                    <div class="flex-column mt-3">
                        <div class="font-h6 text-gray-500 text-uppercase">
                            Columns
                        </div>
                        <div>
                            {{ selectedEmbedding?.params?.columns?.join(',') || '-' }}
                        </div>
                    </div>
                    <div class="flex-column mt-3">
                        <div class="font-h6 text-gray-500 text-uppercase">
                            Tags
                        </div>
                        <div>
                            {{ selectedEmbedding?.tags?.join(' ') || '-' }}
                        </div>
                    </div>
                    <div class="flex-column mt-3">
                        <div class="font-h6 text-gray-500 text-uppercase">
                            Created At
                        </div>
                        <div>
                            {{ selectedEmbedding?.created_at ? new Date(selectedEmbedding?.created_at).toLocaleString() : '-' }}
                        </div>
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
