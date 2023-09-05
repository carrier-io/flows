const FlowWindow = {
    props: ['selectedFlow'],
    // components: {FlowyStuff},
    components: {FlowNodesContainer, DrawFlowStuff},
    data() {
        return {
            flow_blocks: [
                {
                    uid: 'start',
                    name: 'Start',
                    tooltip: 'start block',
                    icon_fa: 'fa fa-terminal fa-xl',
                    inputs: 0,
                    outputs: 1,
                },
                {
                    tooltip: 'embed_deduplicate.svg',
                    icon_url: '/flows/static/icons/embed_deduplicate.svg',
                    uid: 'deduplicate',
                    name: 'deduplicate',
                },
                {
                    tooltip: 'embed_search.svg',
                    icon_url: '/flows/static/icons/embed_search.svg',
                    uid: 'search',
                },
                {
                    tooltip: 'evaluate.svg',
                    icon_url: '/flows/static/icons/evaluate.svg',
                    uid: 'evaluate',
                },
                {
                    tooltip: 'pause.svg',
                    icon_url: '/flows/static/icons/pause.svg',
                    uid: 'pause',
                },
                {
                    tooltip: 'prompt.svg',
                    icon_url: '/flows/static/icons/prompt.svg',
                    uid: 'prompt',
                },
                {
                    tooltip: 'stop.svg',
                    icon_url: '/flows/static/icons/stop.svg',
                    uid: 'stop',
                },
            ]
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
