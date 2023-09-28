const VariablesInput = {
    props: ['modelValue', 'errors'],
    emits: ['update:modelValue'],
    data() {
        return {
            variable_types: constants.variable_types
        }
    },
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
        handleAddVariable() {
            this.modelValue.push({name: '', type: this.variable_types[0].value, value: ''})
            this.refresh_pickers()
        },
        handleDeleteVariable(idx) {
            this.modelValue.splice(idx, 1)
        }
    },
    template: `
<div>
    <div class="d-flex">
        <span class="flex-grow-1 font-h5 font-weight-bold">Variables</span>
        <button class="btn btn-action btn-24"
            @click="handleAddVariable"
        >
            <i class="fa fa-plus fa-xl"></i>
        </button>
    </div>
    <ul class="p-0" style="list-style: none; max-height: 100%; overflow-y: auto;">
        <li class="d-flex align-items-center flex-column"
            v-for="(i, idx) in modelValue" 
            :key="idx"
        >
            <div class="d-flex">
                <div class="custom-input custom-input__sm">
                    <input v-model="i.name" type="text"/>
                </div>
                <div class="mx-1" style="max-width: 105px; width: 105px;">
                    <select class="selectpicker" data-style="select-secondary" 
                        v-model="i.type"
                    >
                        <option v-for="o in variable_types" :value="o.value" :key="o.value">{{ o.label }}</option>
                    </select>
                </div>
                <div class="custom-input custom-input__sm"
                    :class="{
                        'invalid-input': idx === errors?.loc[0] && 
                        errors?.loc[1] === 'value'
                    }"
                >
                    <input v-model="i.value" type="text"/>
                </div>
                <button class="btn btn-action btn-24 ml-2"
                    @click="handleDeleteVariable(idx)"
                >
                    <i class="fa fa-minus fa-xl"></i>
                </button>
            </div>
            <div class="custom-input mb-1" :class="{'invalid-input': idx === errors?.loc[0]}">
                <span class="input_error-msg">{{ errors?.msg }}</span>
            </div>
        </li>
    </ul>
</div>
    `
}

register_component('VariablesInput', VariablesInput)