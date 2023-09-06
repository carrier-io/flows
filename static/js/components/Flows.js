function highlightOnClick() {
    const selectedUniqId = this.getAttribute('data-uniqueid');
    const selected = vueVm.registered_components['flows'].flowsList.find(row => row.id === +selectedUniqId);
    $(this).addClass('highlight').siblings().removeClass('highlight');
    vueVm.registered_components['flows'].FetchFlowById(selected.id);
}

const Flows = {
    components: {
        "flows-list-aside": FlowsListAside,
        // "prompts-modal-create": PromptsModalCreate,
        // "prompts-params": PromptsParams,
        // "prompts-confirm-modal": PromptsConfirmModal,
    },
    props: ['integrations'],
    data() {
        return {
            selectedPrompt: {
                id: null
            },
            showCreateModal: false,
            modalType: 'create',
            flowsList: [],
            showConfirm: false,
            loadingDelete: false,
            isPromptListLoading: false,
            isPromptLoading: false,
            isModalLoading: false,
            isTagsLoaded: false,
            run_id: '24c96b03-eab5-43c8-9257-d8bbe76295b5',
        }
    },
    mounted() {
        $(document).on('vue_init', () => {
            this.isPromptListLoading = true;
            ApiFetchFlows().then(data => {
                $("#flows-aside-table").bootstrapTable('append', data);
                this.flowsList = data;
                if (data.length > 0) {
                    this.selectedPrompt = data[0];
                    this.setFlowListEvents();
                    this.selectFirstPrompt();
                }
                setTimeout(() => {
                    this.isPromptListLoading = false;
                }, 300)
            })

            socket.on("flow_started", (data) => {
                console.log(data)
                if (this.run_id != data['run_id']) {
                    return
                }
                showNotify("SUCCESS", "Workflow has been started")
            });

            socket.on("flow_errors", data => {
                if (this.run_id != data['run_id']) {
                    return
                }
                console.log(data)
            })

            socket.on("task_executed", (data) => {
                console.log(data)
                data = JSON.parse(data)
                if (this.run_id != data['run_id']) {
                    return
                }
                console.log(data)
                if (data["ok"] == true) {
                    showNotify("SUCCESS", `${data['task_id']} completed!`)
                }
                else {
                    showNotify("ERROR", `${data['task_id']} is failed! Reason: ${data['error']}`)
                }
            });

            socket.on("evaluation_extracted_value", data => {
                console.log(data)
            })
        
        });
    },
    methods: {
        FetchFlowById(promptId) {
            this.isPromptLoading = true;
            ApiFetchFlowById(promptId).then(data => {
                setTimeout(() => {
                    this.isPromptLoading = false;
                    this.selectedFlow = { ...data };
                    console.log(data)
                }, 300)
            })
        },
        setFlowListEvents() {
            $('#flows-aside-table').on('click', 'tbody tr:not(.no-records-found)', highlightOnClick);
        },
        selectFirstPrompt() {
            this.FetchFlowById(this.selectedPrompt.id);
            $('#flows-aside-table tbody tr').each(function (i, item) {
                if (i === 0) {
                    const firstRow = $(item);
                    firstRow.addClass('highlight');
                }
            })
        },
        openCreateModal(modalType, prompt = '') {
            this.showCreateModal = true;
        },
        handleCreatePrompt(newRoleName) {
            this.isModalLoading = true;
            ApiCreatePrompt(newRoleName, this.selectedMode).then(data => {
                this.refreshPromptsListTable(data.id);
                this.isModalLoading = false;
                this.showCreateModal = false;
            });
        },
        deletePrompt() {
            this.loadingDelete = true;
            ApiDeletePrompt(this.selectedPrompt.id).then(data => {
                showNotify('SUCCESS', 'Prompt delete.');
                this.loadingDelete = false;
                this.showConfirm = !this.showConfirm;
                this.refreshPromptsListTable()
            });
        },
        refreshPromptsListTable(promptId = null) {
            ApiFetchPrompts().then(data => {
                $('#flows-aside-table').off('click', 'tbody tr:not(.no-records-found)', highlightOnClick);
                $("#flows-aside-table").bootstrapTable('load', data);
                this.flowsList = data;
                this.setFlowListEvents();
                if (promptId) {
                    this.selectedPrompt = data.find(row => row.id === promptId);
                    $('#flows-aside-table').find(`[data-uniqueid='${promptId}']`).addClass('highlight');
                    this.FetchFlowById(promptId);
                } else {
                    if (data.length > 0) {
                        this.selectedPrompt = data[0];
                        this.selectFirstPrompt();
                    }
                }
            });
        },
        openConfirm() {
            this.showConfirm = !this.showConfirm;
        },
        refreshPage() {
            window.location.reload();
        }
    },
    template: `
        <div class="p-3">
            <div class="d-flex gap-4">
                <flows-list-aside
                    @open-create-modal="openCreateModal">
                </flows-list-aside>
                <div v-if="isPromptListLoading" class="position-relative flex-grow-1 card">
                    <div class="layout-spinner">
                        <div class="spinner-centered">
                            <i class="spinner-loader__32x32"></i>
                        </div>
                    </div>
                </div>
                <template v-else>
                    <div class="card w-100">
                    </div>
                </template>
            </div>

            <transition>
                <prompts-modal-create
                    v-if="showCreateModal"
                    @close-create-modal="showCreateModal = false"
                    @save-prompt="handleCreatePrompt"
                    @update-prompt="handleCreatePrompt"
                    :modal-type="modalType"
                    :editable-roles="editableRoles"
                    :is-modal-loading="isModalLoading">
                </prompts-modal-create>
            </transition>
            <transition>
                <prompts-confirm-modal
                    v-if="showConfirm"
                    @close-confirm="openConfirm"
                    :loading-delete="loadingDelete"
                    @delete-prompt="deletePrompt">
                </prompts-confirm-modal>
            </transition>
        </div>
    `
}

register_component('flows', Flows);