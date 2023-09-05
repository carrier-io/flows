const FlowNode = {
    props: ['idx', 'uid', 'tooltip', 'icon_url', 'icon_fa'],
    methods: {
        handleDrag(e) {
            console.log('dragging', e)
            e.dataTransfer.setData("node", this.uid)
        },
    },
    template: `
    <div 
        class="flow_li" 
        data-toggle="tooltip" 
        data-placement="right"
        :title="tooltip"
        draggable="true"
        @dragstart="handleDrag"
    >
        <img v-if="icon_url" :src="icon_url" :alt="name" draggable="false"/>
        <i v-else-if="icon_fa"  :class="icon_fa" draggable="false" style="color: var(--gray600);"></i>
        <span v-else draggable="false">{{ name }}</span>
    </div>
    `
}

const FlowNodesContainer = {
    props: ['flow_blocks'],
    components: {FlowNode},
    watch: {
        flow_blocks(newValue) {
            this.$nextTick(() => $('[data-toggle="tooltip"]').tooltip())
        }
    },
    template: `
<div style="position: absolute; z-index: 100;" class="m-3 d-flex flex-column flow_items_container">
    <FlowNode
        v-for="(i, idx) in flow_blocks"
        v-bind="i"
        :key="idx"
        :idx="idx"
    ></FlowNode>
</div>
`
}