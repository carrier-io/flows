const nodeComponentMapping = {
    start: StartNodeComponent,
    search: EmbeddingSearchNode,
}

const getVueComponent = uid => {
    return nodeComponentMapping[uid] || GenericNodeComponent
}

const DrawFlowStuff = {
    props: ['flow_blocks'],
    data() {
        return {
            editor: undefined,
            dropAreaStyle: {},
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

        // disable exporting these keys. 'options' might not be serializable
        editor.exportSkipKeys = ['options']

        // move properties window when canvas moves
        editor.on('translate', position => {
            const el = document.querySelector('.flow_node_properties_container')
            el.style.top = `${-1 * position.y}px`
            el.style.right = `${position.x}px`
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
        }
    },
    methods: {
        handleBtn() {
            console.log('clicked')
            // this.editor.addModule('nameNewModule');
            // this.editor.changeModule('nameNewModule');

            const data = {name: 'some_name', qwerty: 123}
            const node_1 = this.editor.addNode('foo', 1, 1, 100, 200, 'foo', data, 'Foo');
            const node_2 = this.editor.addNode('bar', 1, 1, 400, 100, 'bar', data, 'Bar A');
            const node_3 = this.editor.addNode('bar', 1, 1, 400, 300, 'bar', data, 'Bar B');
            const node_vue = this.editor.addNode('qwerty', 1, 2, 500, 400, 'asdfg', data, 'GenericNodeComponent', 'vue');
            const node_not_vue = this.editor.addNode('qwerty', 1, 2, 500, 400, 'asdfg', data, 'GenericNodeComponent');

            this.editor.addConnection(node_1, node_2, "output_1", "input_1");
            this.editor.addConnection(node_1, node_3, "output_1", "input_1");
            this.editor.addConnection(node_3, node_vue, "output_1", "input_1");
        },
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

        }
    },
    template: `
<div class="w-100 h-100">
    <div id="drawFlowArea" ref="drawFlowArea" class="w-100 h-100 flow_canvas"
        :style="dropAreaStyle"
        @drop.prevent="handleDrop" 
        @dragover.prevent="dropAreaStyle = {border: '1px dashed var(--basic)'}"
    ></div>
    
<!--    <div class="modal modal-small fixed-left fade shadow-sm" tabindex="-1" role="dialog" id="testDetailsModal">-->
<!--        <div class="modal-dialog modal-dialog-aside" role="document">-->
<!--            <div class="modal-content">-->
<!--                <div class="modal-header">-->
<!--                    <div class="row w-100">-->
<!--                        <div class="col">-->
<!--                            <p class="font-h3 font-weight-bold">Small Modal</p>-->
<!--                        </div>-->
<!--                        <div class="col-xs">-->
<!--                            <button type="button" class="btn mr-2 btn-secondary" data-dismiss="modal" aria-label="Close">-->
<!--                                Cancel-->
<!--                            </button>-->
<!--                            <button type="button" id="save" class="btn   btn-basic">Primary button</button>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                </div>-->
<!--                <div class="modal-body">-->
<!--                    <div class="section">-->
<!--                        <div class="row">-->
<!--                            <div class="col" style="background-color: dimgrey; min-height: 500px;"></div>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                </div>-->
<!--            </div>-->
<!--        </div>-->
<!--    </div>-->

</div>
    `
}

