const FlowWindow = {
    props: ['selectedFlow'],
    components: {FlowNodesContainer, DrawFlowStuff},
    data() {
        return {
            flow_blocks: [],
            is_loading: false
        }
    },
    async mounted() {
        const api_url = '/flows/static/mock_data/flow_blocks.json'
        this.is_loading = true
        const resp = await fetch(api_url)
        this.is_loading = false
        if (resp.ok) {
            this.flow_blocks = await resp.json()
        } else {
            showNotify('ERROR', 'Unable to fetch flow items')
        }
    },
    methods: {
        handleRunFlow() {
            showNotify('INFO', 'running flow ' + this.selectedFlow.name)
        },
        async handleSaveFlow() {
            const api_url = this.$root.build_api_url('flows', 'flow')
            this.is_loading = true
            const resp = await fetch(api_url + '/' + this.$root.project_id + '/' + this.selectedFlow.id, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    flow_data: this.$refs.DrawFlowStuff.editor.export()
                })
            })
            this.is_loading = false
            if (resp.ok) {
                showNotify('SUCCESS', 'Saved')
            } else {
                showNotify('ERROR', 'Save error')
            }
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
            <button class="btn btn-secondary mr-2"
                @click="handleSaveFlow"
                :disabled="is_loading"
            >Save</button>
            <button class="btn btn-basic"
                @click="handleRunFlow"
                :disabled="is_loading"
            >Run</button>
        </div>
    </div>
    <div class="card-body px-0 pb-0">
        <FlowNodesContainer :flow_blocks="flow_blocks"></FlowNodesContainer>
        <DrawFlowStuff 
            :flow_blocks="flow_blocks" 
            :selectedFlow="selectedFlow"
            ref="DrawFlowStuff"
        ></DrawFlowStuff>
    </div>
</div>
`
}
