const GenericNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    mounted() {
        Object.assign(this.$data, this.node_data || {})
    },
    methods: {
        // attachDataProxy() {
        //     const handler = id => {
        //         console.log("E listener here id:", id, '  my id: ', this.node_id)
        //         if (id === this.node_id) {
        //             V.registered_components.DrawFlowStuff.editor.drawflow.drawflow.Home.data[this.node_id].data = this.$data
        //             console.log("Node data attached: ", id)
        //             V.registered_components.DrawFlowStuff.editor.removeListener('nodeCreated', handler)
        //         }
        //     }
        //     V.registered_components.DrawFlowStuff.editor.on('nodeCreated', handler)
        // },
        handleNotify() {
            showNotify('INFO', 'Settings for node')
        }
    },
    template: `
    <div class="d-flex">
        <div class="flex-grow-1">
            <span class="font-h6 text-capitalize">{{ node_meta.name }}</span>
        </div>
        <div>
            <button class="btn btn-action btn-icon__xs"
                @click="handleNotify"
            >
                <i class="icon__18x18 icon-settings"></i>
            </button>
        </div>
    </div>
    `
}


const StartNodeComponent = {
    props: ['node_meta', 'node_data', 'node_id'],
    data() {
        return {
            variables: [{name: 'var1', type: 'string', value: 'qwerty'}],
            options: {
                properties_open: false,
            }
        }
    },
    mounted() {
        Object.assign(this.$data, this.node_data || {})
    },
    computed: {
    },
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
    },
    watch: {
        'options.properties_open': function(newValue) {
            newValue && this.refresh_pickers()
        }
    },
    template: `
    <div class="d-flex flex-column" style="max-width: 400px">
        <div class="d-flex">
            <div class="flex-grow-1">
                <span class="font-h6 text-capitalize">{{ node_meta.name }}</span>
            </div>
            <div>
                <button class="btn btn-action btn-icon__xs"
                    @click="options.properties_open = !options.properties_open"
                >
                    <i class="icon__18x18 icon-settings"></i>
                </button>
            </div>
        </div>
        <div v-if="false">
            id: {{node_id}}
            <br/>
            {{$data}}
            <br/>
            node_meta: {{node_meta}}
        </div>
        <div class="card flow_node_properties_container" 
            draggable="false"
            @drag.prevent.stop=""
            v-if="options.properties_open"
        >
            <div class="card-header d-flex">
                <div class="flex-grow-1">
                    <p>Properties</p>
                    <p>{{ node_meta.name }}</p>
                </div>
                <div>
                    <button class="btn btn-action btn-24"
                        @click="options.properties_open = false"
                    >
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                
            </div>
            <div class="card-body">
                <VariablesInput v-model="variables"></VariablesInput>
            </div>
        </div>
    </div>
    `
}

const VariablesInput = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    data() {
        return {variable_types: ['string', 'number', 'json']}
    },
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
        handleAddVariable() {
            this.modelValue.push({name: '', type: 'string', value: ''})
            this.refresh_pickers()
        },
        handleDeleteVariable(idx) {
            this.modelValue.splice(idx, 1)
        }
    },
    template: `
<div>
    <div class="d-flex">
        <span class="flex-grow-1 font-h6">Variables</span>
        <button class="btn btn-action btn-24"
            @click="handleAddVariable"
        >
            <i class="fa fa-plus"></i>
        </button>
    </div>
    <ul class="p-0" style="list-style: none;">
        <li v-for="(i, idx) in modelValue" :key="idx" class="d-flex align-items-center">
            <div class="custom-input custom-input__sm">
                <input v-model="i.name" type="text"/>
            </div>
            <div>
                <select class="selectpicker " data-style="select-secondary" 
                    v-model="i.type"
                >
                    <option v-for="o in variable_types" :value="o" :key="o">{{ o }}</option>
                </select>
            </div>
            <div class="custom-input custom-input__sm">
                <input v-model="i.value" type="text"/>
            </div>
            <button class="btn btn-action btn-24 ml-2"
                @click="handleDeleteVariable(idx)"
            >
                <i class="fa fa-minus"></i>
            </button>
        </li>
    </ul>
</div>
    `
}

register_component('VariablesInput', VariablesInput)