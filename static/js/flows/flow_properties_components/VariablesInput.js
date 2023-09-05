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