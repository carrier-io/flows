const StartNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    components: {
        'VariablesInput': Vue.markRaw(VariablesInput)
    },
    data() {
        return {
            variables: [],
            options: {
                properties_open: false,
            }
        }
    },
    mounted() {
        delete this.node_data.options
        Object.assign(this.$data, this.node_data || {})
        V.registered_components.DrawFlowStuff.editor.on('nodeSelected', id => {
            console.log('nodeSelected.StartNodeComponent', 'me:', this.node_id, 'selected:', id)
            if (this.node_id !== parseInt(id)) {
                this.options.properties_open = false
            }
        })
    },
    computed: {},
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
    },
    watch: {
        'options.properties_open': function (newValue) {
            if (newValue) {
                this.refresh_pickers()
            }
        }
    },
    template: `
    <div class="d-flex flex-column p-3">
        <div class="d-flex">
            <div class="flex-grow-1">
                <span class="font-h6 text-capitalize">{{ node_meta.name }}</span>
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
            :style="window.V.registered_components.DrawFlowStuff.getCanvasOffsetForPropertiesWindow()"
        >
            <div class="card-header d-flex">
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
            <div class="card-body">
                <VariablesInput v-model="variables"></VariablesInput>
            </div>
        </div>
    </div>
    `
}
