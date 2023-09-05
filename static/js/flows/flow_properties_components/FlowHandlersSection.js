const FlowHandlersSection = {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
<div>
    <label class="w-100">
        <span class="font-h5 font-weight-bold">on Success</span>
        <input type="text" class="form-control w-100"
            v-model="modelValue.on_success"
            placeholder="Variable name"
        />
    </label>
    <label class="w-100 mt-2">
        <span class="font-h5 font-weight-bold">on Failure</span>
        <input type="text" class="form-control w-100"
            v-model="modelValue.on_failure"
            placeholder="Variable name"
        />
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
