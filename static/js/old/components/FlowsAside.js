const FlowsListAside = {
    data() {
        return {
            loadingDelete: false,
        }
    },
    computed: {
        responsiveTableHeight() {
            return `${(window.innerHeight - 270)}px`;
        }
    },
    template: `
        <aside class="card card-table-sm" style="min-width: 340px; width: 340px">
            <div class="row p-4">
                <div class="col-4">
                    <p class="font-h4 font-bold">Flows</p>
                </div>
                <div class="col-8">
                    <div class="d-flex justify-content-end">
                        <button type="button"
                            @click="$emit('open-create-modal')"
                            class="btn btn-basic btn-sm btn-icon__sm">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body" style="padding-top: 0">
                <table class="table table-borderless table-fix-thead"
                    id="flows-aside-table"
                    data-toggle="table"
                    data-unique-id="id">
                    <thead class="thead-light bg-transparent">
                        <tr>
                            <th data-visible="false" data-field="id">index</th>
                            <th data-sortable="true" data-field="name" data-width="40" data-width-unit="%" >NAME</th>
                            <th data-width="32" data-formatter='<div class="d-none justify-content-end">
                                    <button class="btn btn-default btn-xs btn-table btn-icon__xs flow_delete"><i class="icon__18x18 icon-delete"></i></button>
                                </div>'
                                data-events="flowAsideEvents">
                            </th>
                        </tr>
                    </thead>
                    <tbody :style="{'height': responsiveTableHeight}">
                    </tbody>
                </table>
            </div>
        </aside>
    `
}

var flowAsideEvents = {
    "click .flow_delete": function (e, value, row, index) {
        e.stopPropagation();
        const vm = vueVm.registered_components.flows;
        vm.openConfirm();
    },
}
