const CreateFlowModal = {
    emits: ['flowCreated'],
    data() {
        return {
            error: null,
            is_loading: false,
            name: ''
        }
    },
    mounted() {
        $(this.$el).on('hide.bs.modal', this.clear)
    },
    methods: {
        clear() {
            this.error = null
            this.is_loading = false
            this.name = ''
        },
        async handleCreate() {
            const api_url = this.$root.build_api_url('flows', 'flows')
            this.is_loading = true
            const resp = await fetch(api_url + '/' + this.$root.project_id, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: this.name})
            })
            this.is_loading = false
            if (resp.ok) {
                const data = await resp.json()
                this.$emit('flowCreated', data)
                $(this.$el).modal('hide')
            } else {
                const {error} = await resp.json()
                this.error = error
            }
        }
    },
    template: `
<div id="CreateFlowModal" class="modal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content flex-column">
            <div class="modal-header">
                <span class="font-h3 font-semibold">Create flow</span>
            </div>
            
            <div class="d-flex flex-column modal-body">
                <div class="notification notification-error" style="flex-direction: row"
                    v-if="error"
                >
                    <div class="notification-body">
                        <div class="notification-content">
                            <div class="notification-title">{{ error }}</div>
                        </div>
                    </div>
                </div>
                
                <label class="font-h5 font-semibold flex-grow-1 mr-1">
                    Name
                    <input
                        class="form-control"
                        type="text"
                        placeholder="Flow name"
                        v-model="name"
                    />
                </label>
            </div>
            <div class="modal-footer d-flex">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">
                    Cancel
                </button>
                <button type="button" class="btn btn-basic"
                    @click="handleCreate"
                    :disabled="is_loading"
                >
                    Create <i v-if="is_loading" class="preview-loader__white ml-2"></i>
                </button>
           </div>
        </div>
    </div>
</div>
    `
}