const FlowHandlersSection = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    data() {
        return {
            failure_options: constants.on_failure_options
        }
    },
    template: `
<div>
    <label class="w-100">
        <span class="font-h5 font-weight-bold">on Success</span>
        <input type="text" class="form-control w-100"
            v-model="modelValue.on_success"
            placeholder="Variable name"
        />
    </label>
    <label class="mt-2 d-flex flex-column">
        <span class="font-h5 font-weight-bold">on Failure</span>
        <select class="selectpicker bootstrap-select__b" 
            v-model="modelValue.on_failure"
        >
            <option 
                v-for="i in failure_options" 
                :value="i.value"
            >
                {{ i.label }}
            </option>
        </select>
    </label>
    <label class="d-flex align-items-center custom-checkbox mt-2">
        <input class="custom__checkbox"
            type="checkbox"
            v-model="modelValue.log_results"
        />
        <span class="w-100 d-inline-block font-h5 ml-2">Log results</span>
    </label>
</div>
    `
}

register_component('FlowHandlersSection', FlowHandlersSection)
