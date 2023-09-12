const LeftWindow = {
    emits: ['update:modelValue'],
    components: {
        FlowsTable,
        CreateFlowModal,
    },
    methods: {
        handleNewFlow(flow_data) {
            this.$refs.flow_table.handleNewFlow(flow_data)
        }
    },
    template: `
<div class="card side-window">
    <pre class="tmp-helper">LeftWindow.js</pre>
    <div class="card-header d-flex">
        <div class="flex-grow-1 font-h4 font-bold">
            Embeddings
        </div>
        <div>
            <button class="btn btn-32 btn-secondary" 
                data-toggle="modal" data-target="#CreateFlowModal"
            >
                <i class="fa fa-plus"></i>
            </button>
        </div>
    </div>
    <div>
        <FlowsTable
            @selectFlow="data => $emit('update:modelValue', data)"
            ref="flow_table"
        ></FlowsTable>
<!--            ref="eTable"-->
    </div>
    <CreateFlowModal
        @flowCreated="handleNewFlow"
    ></CreateFlowModal>
</div>
`
}
