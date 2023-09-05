const FlowWindow = {
    props: ['selectedFlow'],
    // components: {FlowyStuff},
    components: {FlowNodesContainer, DrawFlowStuff},
    data() {
        return {
            flow_blocks: []
        }
    },
    async mounted() {
        const api_url = '/flows/static/mock_data/flow_blocks.json'
        const resp = await fetch(api_url)
        if (resp.ok) {
            this.flow_blocks = await resp.json()
        } else {
            showNotify('ERROR', 'Unable to fetch flow items')
        }
    },
    methods: {
        handleRunFlow() {
            showNotify('INFO', 'running flow ' + this.selectedFlow.name)
        }
    },
    computed: {},
    template: `
<div class="card flex-grow-1">
    <pre class="tmp-helper">FlowWindow.js</pre>
    <div class="d-flex card-header">
        <div class="flex-grow-1 font-h4 font-bold">
            {{ selectedFlow?.name }}
        </div>
        <div>
            <button class="btn btn-basic"
                @click="handleRunFlow"
            >Run</button>
        </div>
    </div>
    <div class="card-body px-0 pb-0">
<!--        <FlowyStuff :icon_url="icon_url"></FlowyStuff>-->
        <FlowNodesContainer :flow_blocks="flow_blocks"></FlowNodesContainer>
        <DrawFlowStuff :flow_blocks="flow_blocks"></DrawFlowStuff>
    </div>
</div>
`
}
