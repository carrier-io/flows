const EmbeddingSearchNode = {
    props: ['node_meta', 'node_data', 'node_id'],
    data() {
        return {
            embedding: null,
            flow_handle_settings: {
                on_success: '',
                on_failure: '',
                log_results: false
            },
            cutoff: 0.6,
            top_k: 3,
            options: {
                properties_open: false,
                sliderCutoff: undefined,
                sliderTopK: undefined,
            }
        }
    },
    async mounted() {
        Object.assign(this.$data, this.node_data || {})
        V.registered_components.DrawFlowStuff.editor.on('nodeSelected', id => {
            if (this.node_id !== id) {
                this.options.properties_open = false
            }
        })
        await this.fetchEmbeddings()
        // if (this.flow_handle_settings.on_success === '') {
        //     this.flow_handle_settings.on_success = 'step_' + this.node_id
        // }
    },
    computed: {
        embeddings() {
            return V.custom_data.embeddings
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
        }
    },
    watch: {
        'options.properties_open': function (newValue) {
            if (newValue) {
                this.$nextTick(this.initSliders)
            }
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
        >
            <div class="card-header d-flex pb-2">
                <div class="flex-grow-1">
                    <p>Properties</p>
                    <span>{{ node_meta.name }}</span>
                </div>
                <div>
                    <button class="btn btn-action btn-24"
                        @click="options.properties_open = false"
                    >
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                
            </div>
            <div class="card-body pt-2" style="border-top: 1px solid var(--gray200)">
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
                
                
            </div>
        </div>
    </div>
    `
}
