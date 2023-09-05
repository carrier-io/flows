const EmbeddingSearchNode = {
    props: ['node_meta', 'node_data', 'node_id'],
    components: {
        'FlowHandlersSection': Vue.markRaw(FlowHandlersSection)
    },
    data() {
        return {
            embedding: null,
            flow_handle_settings: {
                on_success: '',
                on_failure: 0,
                log_results: false
            },
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
                logs: 'Logs will be here'
            }
        }
    },
    async mounted() {
        delete this.node_data.options
        Object.assign(this.$data, this.node_data || {})
        V.registered_components.DrawFlowStuff.editor.on('nodeSelected', id => {
            console.log('nodeSelected.EmbeddingSearchNode', 'me:', this.node_id, 'selected:', id)
            if (this.node_id !== parseInt(id)) {
                this.options.properties_open = false
            }
        })
        await this.fetchEmbeddings()
    },
    computed: {
        embeddings() {
            return V.custom_data.embeddings
        },
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
                this.refresh_pickers()
            } else {
                showNotify('ERROR', 'Error fetching embeddings')
            }
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
        <div class="d-flex flex-column" style="border-top: 1px solid var(--gray200)">
            <div class="d-flex flex-column p-3">
                <select class="selectpicker" data-style="select-secondary" 
                    v-model="embedding"
                >
                    <option v-for="i in embeddings" :value="i.id" :key="i.id">
                        {{ i.library_name }}
                    </option>
                </select>
            </div>
        </div>
        
        <div v-if="true">
            id: {{node_id}}
            <br/>
            {{$data}}
            <br/>
        </div>
        
        <div class="card flow_node_properties_container" 
            v-if="options.properties_open"
            :style="window.V.registered_components.DrawFlowStuff.getCanvasOffsetForPropertiesWindow()"
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
            
    
            <div class="card-body pt-2 tab-content" style="border-top: 1px solid var(--gray200)">
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
                    :class="{'show': options.selectedTabIndex === 2, 'active': options.selectedTabIndex === 2}"
                >
                    <pre class="form-control w-100 h-100 overflow-auto">{{ options.logs }}</pre>
                </div>
                    
            </div>
        </div>
    </div>
    `
}
