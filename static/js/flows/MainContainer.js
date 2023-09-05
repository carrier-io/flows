const MainContainer = {
    components: {
        LeftWindow,
        FlowWindow,
        DebugWindow
    },
    data() {
        return {
            selectedFlow: undefined
        }
    },
    template: `
<div class="m-3 d-flex" id="container-window">
    <LeftWindow class="mr-3" v-model="selectedFlow" style="display: none;"></LeftWindow>
    <DebugWindow class="mr-3"></DebugWindow>
    <FlowWindow :selectedFlow="selectedFlow"></FlowWindow>
</div>
`
}

register_component('MainContainer', MainContainer)