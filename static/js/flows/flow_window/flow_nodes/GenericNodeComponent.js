const GenericNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    mounted() {
        Object.assign(this.$data, this.node_data || {})
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
        }
    },
    template: `
    <div class="d-flex">
        <div class="flex-grow-1">
            <span class="font-h6 text-capitalize">{{ node_meta.name }}</span>
        </div>
        <div>
            <button class="btn btn-action btn-icon__xs"
                @click="handleNotify"
            >
                <i class="icon__18x18 icon-settings"></i>
            </button>
        </div>
    </div>
    `
}