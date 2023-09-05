const handleDeleteFlow = async (el, id) => {
    window.event.stopPropagation()
    console.log('deleting flow with id', id ,el)
    showNotify('INFO', `Deleting flow ${id}`)
    return
    const apiUrl = V.build_api_url('flows', 'flows')
    const resp = await fetch(apiUrl + '/' + V.project_id + '/' + id, {
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
            mock_data: Array.from(Array(10)).map((_, i) => ({id: i, name: 'flow ' + i}))
        }
    },
    mounted() {
        const $table = $(this.$refs.table)
        $table.on('click-row.bs.table', this.handleRowClick)
        $table.on('post-body.bs.table', () => {
            $table.find('tr').css('cursor', 'pointer')
        })
    },
    methods: {
        handleRowClick(row, element, field) {
            $(this.$refs.table).find('tr').removeClass('highlight')
            $(field[0]).addClass('highlight')
            this.$emit('selectFlow', element)
        },
        refresh() {
            $(this.$refs.table).bootstrapTable('refresh')
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
        class="table table-borderless"
        :data-data="JSON.stringify(mock_data)"
        data-toggle="table"
        data-unique-id="id"
        data-virtual-scroll="true"
        data-pagination="false"
        data-loading-template="loadingTemplate"
        data-pagination-pre-text="<img src='/design-system/static/assets/ico/arrow_left.svg'>"
        data-pagination-next-text="<img src='/design-system/static/assets/ico/arrow_right.svg'>"
        
        ref="table"
    >
<!--        :data-url="tableUrl"-->
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
const LeftWindow = {
    emits: ['update:modelValue'],
    components: {
        FlowsTable,
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
                data-toggle="modal" data-target="#create_embedding"
            >
                <i class="fa fa-plus"></i>
            </button>
        </div>
    </div>
    <div>
        <FlowsTable
            @selectFlow="data => $emit('update:modelValue', data)"
        ></FlowsTable>
<!--            ref="eTable"-->
    </div>
</div>
`
}
