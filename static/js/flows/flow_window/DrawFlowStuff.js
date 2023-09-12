const nodeComponentMapping = {
    start: StartNodeComponent,
    search: EmbeddingSearchNode,
    deduplicate: EmbeddingDeduplicateNode,
    evaluate: EvaluateNode,
    prompt: PromptNode
}

const getVueComponent = uid => {
    return nodeComponentMapping[uid] || GenericNodeComponent
}

const DrawFlowStuff = {
    props: ['flow_blocks', 'selectedFlow'],
    data() {
        return {
            editor: undefined,
            dropAreaStyle: {},
            is_loading: false,
            loadingOverlayVisible: false
        }
    },
    mounted() {
        const vueProxy = {version: 3, h: Vue.h, render: Vue.render}
        const editor = new Drawflow(this.$refs.drawFlowArea, vueProxy, vueApp._context)

        editor.reroute = true
        editor.reroute_fix_curvature = true

        // editor export data will become reactive proxy
        editor.attachVueDataProxy = true

        // disable zoom function for now
        editor.zoom_max = 1
        editor.zoom_min = 1
        editor.curvature = 0
        editor.reroute_curvature_start_end = -0.1
        editor.reroute_curvature = 0

        // disable exporting these keys. 'options' might not be serializable
        editor.exportSkipKeys = ['options']

        // move properties window when canvas moves
        editor.on('translate', position => {
            this.$root.custom_data.properties_window_offset = {
                top: `${-1 * position.y}px`,
                right: `${position.x}px`
            }
        })

        editor.on('nodeSelected', id => {
            console.log('nodeSelected.main', 'selected:', id)
            this.$root.custom_data.selected_node = parseInt(id)
        })

        editor.start()

        this.editor = editor
        this.$root.registered_components.DrawFlowStuff = this
    },
    watch: {
        flow_blocks(newValue) {
            newValue.forEach(i => {
                this.editor.registerNode(i.uid, Vue.markRaw(getVueComponent(i.uid)), {node_meta: i}, {});
            })
        },
        async selectedFlow(newValue) {
            console.log('new flow selected', newValue)
            this.editor.clear()
            const {id} = newValue
            // if (!flow_data) {
            //     flow_data = await this.fetchFlowDetails(id)
            //     flow_data = flow_data.flow_data
            // }
            const {flow_data} = await this.fetchFlowDetails(id)

            flow_data && this.editor.import(flow_data)

        },
        is_loading(newValue) {
            if (!newValue) {
                this.loadingOverlayVisible = false
            }
            setTimeout(() => {
                this.loadingOverlayVisible = this.is_loading
            }, 1000)
        }
    },
    methods: {
        async fetchFlowDetails(flow_id) {
            const api_url = this.$root.build_api_url('flows', 'flow')
            this.is_loading = true
            const resp = await fetch(api_url + '/' + this.$root.project_id + '/' + flow_id)
            this.is_loading = false
            if (resp.ok) {
                return await resp.json()
            } else {
                showNotify('ERROR', 'Can\'t load flow')
            }
        },
        // handleBtn() {
        //     console.log('clicked')
        //     // this.editor.addModule('nameNewModule');
        //     // this.editor.changeModule('nameNewModule');
        //
        //     const data = {name: 'some_name', qwerty: 123}
        //     const node_1 = this.editor.addNode('foo', 1, 1, 100, 200, 'foo', data, 'Foo');
        //     const node_2 = this.editor.addNode('bar', 1, 1, 400, 100, 'bar', data, 'Bar A');
        //     const node_3 = this.editor.addNode('bar', 1, 1, 400, 300, 'bar', data, 'Bar B');
        //     const node_vue = this.editor.addNode('qwerty', 1, 2, 500, 400, 'asdfg', data, 'GenericNodeComponent', 'vue');
        //     const node_not_vue = this.editor.addNode('qwerty', 1, 2, 500, 400, 'asdfg', data, 'GenericNodeComponent');
        //
        //     this.editor.addConnection(node_1, node_2, "output_1", "input_1");
        //     this.editor.addConnection(node_1, node_3, "output_1", "input_1");
        //     this.editor.addConnection(node_3, node_vue, "output_1", "input_1");
        // },
        getNodeCoords(clientX, clientY) {
            const pos_x = clientX * (this.editor.precanvas.clientWidth / (this.editor.precanvas.clientWidth * this.editor.zoom)) - (this.editor.precanvas.getBoundingClientRect().x * (this.editor.precanvas.clientWidth / (this.editor.precanvas.clientWidth * this.editor.zoom)));
            const pos_y = clientY * (this.editor.precanvas.clientHeight / (this.editor.precanvas.clientHeight * this.editor.zoom)) - (this.editor.precanvas.getBoundingClientRect().y * (this.editor.precanvas.clientHeight / (this.editor.precanvas.clientHeight * this.editor.zoom)));
            return [pos_x, pos_y]
        },
        getNodeMeta(uid) {
            return this.flow_blocks.find(i => i.uid === uid)
        },
        handleDrop(e) {
            this.dropAreaStyle = {}
            // console.log(e.type, e?.target, e.dataTransfer)
            const nodeUid = e.dataTransfer.getData("node")
            // console.log(nodeUid)
            const [pos_x, pos_y] = this.getNodeCoords(e.clientX, e.clientY)
            // console.log({pos_x, pos_y})
            const nodeMeta = this.getNodeMeta(nodeUid)
            delete nodeMeta.node_data
            this.editor.addNode(
                nodeUid,
                nodeMeta.inputs === undefined ? 1 : nodeMeta.inputs,
                nodeMeta.outputs === undefined ? 1 : nodeMeta.outputs,
                pos_x,
                pos_y,
                'flow_node',
                {},
                nodeUid,
                'vue'
            )

        },
    },
    template: `
    <div id="drawFlowArea" ref="drawFlowArea" class="w-100 h-100 flow_canvas"
        :style="dropAreaStyle"
        @drop.prevent="handleDrop" 
        @dragover.prevent="dropAreaStyle = {border: '1px dashed var(--basic)'}"
    >
        <div class="loadingOverlay" v-show="loadingOverlayVisible ">
            <span class="font-h1">Loading</span>
        </div>
    </div>
    `
}

