const EmbeddingDeduplicateNode = {
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
            options: {
                properties_open: false,
                sliderCutoff: undefined,
                selectedTabIndex: 0,
                tabs: ['Data', 'Advanced', 'Logs'],
                logs: 'Logs will be here'
            }
        }
    },
    async mounted() {
        load_node_data(this)

        this.embeddings === undefined && await this.fetchEmbeddings()
        this.refresh_pickers()
    },
    computed: {
        embeddings() {
            return V.custom_data.embeddings
        },
        selectedEmbedding() {
            return this.embeddings.find(i => i.id === this.embedding)
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
    },
    template: `
    <div class="d-flex flex-column">
        <div class="d-flex p-3">
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
                    v-model="embedding"
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
                            {{ selectedEmbedding?.params?.columns.join(',') || '-' }}
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
