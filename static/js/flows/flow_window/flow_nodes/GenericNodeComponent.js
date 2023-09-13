const GenericNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    data() {
        return {
            options: {
                properties_open: false,
            }
        }
    },
    mounted() {
        load_node_data(this)
    },
    methods: {
        // attachDataProxy() {
        //     const handler = id => {
        //         console.log("E listener here id:", id, '  my id: ', this.node_id)
        //         if (id === this.node_id) {
        //             V.registered_components.DrawFlowStuff.editor.drawflow.drawflow.Home.data[this.node_id].data = this.$data
        //             console.log("Node data attached: ", id)
        //             V.registered_components.DrawFlowStuff.editor.removeListener('nodeCreated', handler)
        //         }
        //     }
        //     V.registered_components.DrawFlowStuff.editor.on('nodeCreated', handler)
        // },
        handleNotify() {
            showNotify('INFO', 'Settings for node')
            this.options.properties_open = !this.options.properties_open
        }
    },
    watch: {
        'window.V.custom_data.selected_node': function(newValue) {
            if (this.node_id !== newValue) {
                this.options.properties_open = false
            }
        },
    },
    template: `
    <div class="d-flex p-3">
        <div class="flex-grow-1">
            <span class="font-h6 text-capitalize">{{ node_meta.display_name }}</span>
        </div>
        <div>
            <button class="btn btn-action btn-icon__xs"
                @click="handleNotify"
            >
                <i class="icon__18x18 icon-settings"></i>
            </button>
        </div>
        <div class="card flow_node_properties_container" 
            v-if="options.properties_open"
            :style="window.V.custom_data.properties_window_offset"
        >
            <div class="card-header d-flex">
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
            <div class="card-body">
            </div>
        </div>
    </div>
    `
}