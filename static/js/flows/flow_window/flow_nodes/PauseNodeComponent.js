const PauseNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    data() {
        return {
            wait_time_ms: 1000,
        }
    },
    mounted() {
        load_node_data(this)
    },
    computed: {},
    methods: {},
    watch: {},
    template: `
    <div class="d-flex flex-column">
        <div class="d-flex align-items-center p-3">
            <div class="flex-grow-1">
                <span class="font-h6 text-capitalize">
                    {{ node_meta.display_name }}
                </span>
            </div>
            <div>
            </div>
        </div>
        
         <div class="d-flex input-group p-3" style="border-top: 1px solid var(--gray200)">
            <input type="number" class="form-control" 
                step="1000"
                min="0"
                v-model="wait_time_ms"
            />
            <div class="input-group-append m-0">
                <div class="input-group-text" style="height: 37px;">ms</div>
            </div>
        </div>
        
    </div>
    `
}
