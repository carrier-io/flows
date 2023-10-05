const TextVariablesInput = {
    props: ['modelValue', 'errors', 'title'],
    emits: ['update:modelValue'],
    methods: {
        refresh_pickers() {
            this.$nextTick(() => $(this.$el).find('.selectpicker').selectpicker('refresh'))
        },
        handleAddVariable() {
            this.modelValue.push({name: '', value: ''})
            this.refresh_pickers()
        },
        handleDeleteVariable(idx) {
            this.modelValue.splice(idx, 1)
        }
    },
    template: `
<div>
    <div class="d-flex">
        <span class="flex-grow-1 font-h5 font-weight-bold">{{ title }}</span>
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
                <div class="custom-input custom-input__sm mr-2">
                    <input v-model="i.name" type="text"/>
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

register_component('TextVariablesInput', TextVariablesInput)