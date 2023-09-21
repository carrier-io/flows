const FlowWindow = {
    props: ['selectedFlow'],
    components: {FlowNodesContainer, DrawFlowStuff},
    data() {
        return {
            flow_blocks: [],
            is_loading: false,
            tracked_run_ids: {}
        }
    },
    async mounted() {
        $(document).on('vue_init', async () => {
            // const api_url = '/flows/static/mock_data/flow_blocks.json'
            const api_url = this.$root.build_api_url('flows', 'nodes') + '/' + this.$root.project_id
            this.is_loading = true
            const resp = await fetch(api_url)
            this.is_loading = false
            if (resp.ok) {
                this.flow_blocks = await resp.json()
            } else {
                showNotify('ERROR', 'Unable to fetch flow items')
            }
        })
        window.socket.on(constants.sio_events.node_finished, this.handleSioNodeFinished)
        window.socket.on(constants.sio_events.flow_finished, this.handleSioFlowFinished)
        window.socket.on(constants.sio_events.flow_started, this.handleSioFlowStarted)

    },
    methods: {
        async handleRunFlow() {
            this.restoreNodeStates()
            const api_url = this.$root.build_api_url('flows', 'flow')
            this.is_loading = true
            const resp = await fetch(api_url + '/' + this.$root.project_id + '/' + this.selectedFlow.id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    async: true,
                    flow_data: this.$refs.DrawFlowStuff.editor.export()
                })
            })
            this.is_loading = false
            if (resp.ok) {
                const {run_id} = await resp.json()
                this.tracked_run_ids[this.selectedFlow.id] = run_id
                showNotify('SUCCESS', `Flow started ${run_id}`)
            } else {
                showNotify('ERROR', 'Flow run error')
                this.handleValidationErrors(await resp.json())
            }
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
        },
        handleValidationErrors(errors_json) {
            console.log(errors_json)
            const {errors} = errors_json
            Object.entries(errors).forEach(([node_id, error_data]) => {
                const vue_data = this.$refs.DrawFlowStuff.editor.drawflow.drawflow['Home'].data[node_id].data
                if (vue_data.options) {
                    vue_data.options.validation_errors = error_data
                }
            })
        },
        clearValidationErrors() {
            Object.entries(
                this.$refs.DrawFlowStuff.editor.drawflow.drawflow['Home'].data
            ).forEach(([node_id, {data}]) => {
                if (data.options) {
                    data.options.validation_errors = []
                }
            })
        },
        setAllNodesStatus(status) {
            Object.entries(
                this.$refs.DrawFlowStuff.editor.drawflow.drawflow['Home'].data
            ).forEach(([node_id, {data}]) => {
                if (data.options) {
                    data.options.status = status
                }
            })
        },
        clearNodeStatus() {
            this.setAllNodesStatus(constants.node_statuses.idle)
        },
        setNodesRunning() {
            this.setAllNodesStatus(constants.node_statuses.running)
        },
        setNodesFinished() {
            this.setAllNodesStatus(constants.node_statuses.success)
        },
        restoreNodeStates() {
            this.clearValidationErrors()
            this.setNodesRunning()
        },
        checkEventRunId(run_id) {
            return run_id === this.tracked_run_ids[this.selectedFlow.id]
        },
        handleSioNodeFinished(data) {
            // todo: handle this on backend:
            if (typeof data === 'string') {
                data = JSON.parse(data)
            }
            // console.log('sio event', 'flows_node_finished')
            // console.log(typeof data, data)
            const {ok, result, run_id, task_id: node_id, error} = data
            // console.log({ok, result, run_id, node_id})
            if (this.checkEventRunId(run_id)) {
                const data_ref = this.$refs.DrawFlowStuff.editor.drawflow.drawflow['Home'].data[node_id].data
                if (data_ref.options) {
                    data_ref.options.logs = ok ? result : error
                    data_ref.options.status = ok ? constants.node_statuses.success : constants.node_statuses.error
                }
            } else {
                console.warn('Received sio for untracked flow. rid:', run_id)
            }
        },
        handleSioFlowStarted(data) {
            const {run_id} = data
            console.log('flow started', data)
            if (this.checkEventRunId(run_id)) {
                const [_, start_node] = Object.entries(
                    this.$refs.DrawFlowStuff.editor.drawflow.drawflow['Home'].data
                ).find(([node_id, {name}]) => {
                    return name === 'start'
                })
                console.log(start_node)
                start_node.data.options.status = constants.node_statuses.success
            }
        },
        handleSioFlowFinished(data) {
            const {ok, result, run_id, error} = data
            if (this.checkEventRunId(run_id)) {
                // this.setNodesFinished()
                const [_, end_node] = Object.entries(
                    this.$refs.DrawFlowStuff.editor.drawflow.drawflow['Home'].data
                ).find(([node_id, {name}]) => {
                    return name === 'end'
                })
                if (ok) {
                    end_node.data.options.status = constants.node_statuses.success
                    end_node.data.options.result = result
                    showNotify('SUCCESS', 'Flow finished')
                } else {
                    // this.handleValidationErrors({errors: data.error})
                    end_node.data.options.status = constants.node_statuses.error
                    end_node.data.options.result = error
                    showNotify('WARNING', 'Flow had some errors')
                }
                console.log('flow finished', data)
            }
        },
    },
    computed: {},
    template: `
<div class="card flex-grow-1">
    <pre class="tmp-helper">FlowWindow.js</pre>
    <div class="d-flex card-header" style="border-bottom: 1px solid var(--gray200);">
        <div class="flex-grow-1 font-h4 font-bold">
            <span data-toggle="tooltip" data-placement="top" 
                :data-original-title="'id: ' + selectedFlow?.id"
            >
                {{ selectedFlow?.name }}
            </span>
        </div>
        <div>
            <button class="btn btn-secondary mr-2"
                @click="handleSaveFlow"
                :disabled="is_loading"
            >Save</button>
            <button class="btn btn-basic"
                @click="handleRunFlow"
                :disabled="is_loading"
            >Save & Run</button>
        </div>
    </div>
    <div class="card-body p-0">
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
