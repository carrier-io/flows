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
        load_node_data(this)
    },
    computed: {},
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
            :style="window.V.custom_data.properties_window_offset"
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
