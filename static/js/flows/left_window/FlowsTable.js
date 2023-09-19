const handleDeleteFlow = async (el, id) => {
    window.event.stopPropagation()
    const api_url = V.build_api_url('flows', 'flow')
    const resp = await fetch(api_url + '/' + V.project_id + '/' + id, {
        method: 'DELETE'
    })
    if (resp.ok) {
        $(el.closest('table')).bootstrapTable('refresh')
        showNotify('SUCCESS', 'Deleted')
    } else {
        showNotify('ERROR', 'Deletion error')
    }
}
var flowsListFormatter = (value, row) => {
    return `
        <button class="btn btn-action btn-24" onclick="handleDeleteFlow(this, ${row.id})">
            <i class="fas fa-trash-alt"></i>
        </button>
    `
}

const FlowsTable = {
    emits: ['selectFlow'],
    data() {
        return {
            is_loading: false,
        }
    },
    mounted() {
        const $table = $(this.$refs.table)
        $table.on('click-row.bs.table', this.handleRowClick)
    },
    methods: {
        handleSelectRow(tr, data) {
            const $table = $(this.$refs.table)
            $table.find('tr').removeClass('highlight')
            $(tr).addClass('highlight')
            this.$emit('selectFlow', data)
        },
        handleRowClick(row, element, field) {
            this.handleSelectRow(field[0], element)
        },
        refresh() {
            $(this.$refs.table).bootstrapTable('refresh')
        },
        handleNewFlow(flow_data) {
            const $table = $(this.$refs.table)
            const new_row = $table.bootstrapTable('insertRow', {
                index: 0,
                row: flow_data
            })
            console.log('new_row', new_row)
            this.handleSelectRow($table.find(`tr[data-uniqueid="${flow_data.id}"`), flow_data)
        }
    },
    computed: {
        tableUrl() {
            const apiUrl = this.$root.build_api_url('flows', 'flows')
            return apiUrl + '/' + this.$root.project_id
        },
    },
    template: `
    <table
        id="FlowsTable"
        class="table table-borderless"
        :data-url="tableUrl"
        data-toggle="table"
        data-unique-id="id"
        data-virtual-scroll="true"
        data-pagination="false"
        data-loading-template="loadingTemplate"
        data-pagination-pre-text="<img src='/design-system/static/assets/ico/arrow_left.svg'>"
        data-pagination-next-text="<img src='/design-system/static/assets/ico/arrow_right.svg'>"
        
        ref="table"
    >
        <thead class="thead-light">
            <tr>
                <th data-visible="false" data-field="id">id</th>
                <th scope="col" data-sortable="true" data-field="name" class="w-100">Name</th>
                <th scope="col" data-align="right" data-formatter="flowsListFormatter">
                </th>
            </tr>
        </thead>
    </table>
    `
}
