const ConnectedSlider = {
    props: ['modelValue', 'min', 'max', 'step', 'format'],
    emits: ['update:modelValue'],
    data() {
        return {
            slider: undefined,
        }
    },
    mounted() {
        // console.log('ConnectedSlider mounting')
        const slider_options = {
            start: this.modelValue,
            connect: 'lower',
            range: {
                'min': this.min,
                'max': this.max
            },
            step: this.step,
        }
        if (this.format !== undefined) {
            slider_options.format = this.format
        }

        this.slider = noUiSlider.create(this.$refs.slider, slider_options)
        // this.slider.on('update', (values, handle) => {
        this.slider.on('slide', (values, handle) => {
            // console.log('slide', {newValue: values[0], current: this.modelValue})
            this.modelValue !== values[0] && this.$emit('update:modelValue', values[0])
        })
    },
    watch: {
        modelValue(newValue) {
            // console.log('modelValue', {newValue, current: this.slider.get()})
            newValue !== this.slider.get() && this.slider.set(newValue, false)
        }
    },
    template: `
    <div class="d-flex">
        <div ref="slider" class="flex-grow-1"></div>
        <div class="ml-3">
            <input type="number" class="form-control" 
                :min="min" 
                :max="max"  
                :step="step"
                :value="modelValue"
                @change="$emit('update:modelValue', $event.target.value)"
            />
        </div>
    </div>
    `
}

register_component('ConnectedSlider', ConnectedSlider)