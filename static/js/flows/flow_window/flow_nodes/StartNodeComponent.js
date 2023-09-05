const StartNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    data() {
        return {
            variables: [{name: 'var1', type: 'string', value: 'qwerty'}],
            options: {
                properties_open: false,
            }
        }
    },
    mounted() {
        Object.assign(this.$data, this.node_data || {})
        V.registered_components.DrawFlowStuff.editor.on('nodeSelected', id => {
            if (this.node_id !== id) {
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
            newValue && this.refresh_pickers()
        }
    },
    template: `
    <div class="d-flex flex-column" style="max-width: 400px">
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
        <div v-if="false">
            id: {{node_id}}
            <br/>
            {{$data}}
            <br/>
            node_meta: {{node_meta}}
        </div>
        <div class="card flow_node_properties_container" 
            draggable="false"
            @drag.prevent.stop=""
            v-if="options.properties_open"
        >
            <div class="card-header d-flex">
                <div class="flex-grow-1">
                    <p>Properties</p>
                    <p>{{ node_meta.name }}</p>
                </div>
                <div>
                    <button class="btn btn-action btn-24"
                        @click="options.properties_open = false"
                    >
                        <i class="fa fa-times"></i>
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
