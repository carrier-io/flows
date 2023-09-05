// const TmpVueItem = {
//     template: `
//     <div>
//     <b>THIS IS CUSTOM DIV COMPONENT</b>
// </div>
//     `
// }
//
// register_component('TmpVueItem', TmpVueItem)



const FlowyStuff = {
    // props: ['icon_url'],
    // components: {FlowLI},
    data() {
        return {
            spacing_x: 20,
            spacing_y: 80,
            flowy_data: null,
        }
    },
    mounted() {
        this.$nextTick(() => {
            flowy(
                this.$refs.flowy_canvas,
                this.onGrab,
                this.onRelease,
                this.onSnap,
                this.spacing_x, this.spacing_y
            )
        })
    },
    methods: {
        onGrab(block) {
            // When the user grabs a block
            console.log('ongrab', block)
            block.classList.add("blockdisabled");
            this.tempblock2 = block;
        },
        onRelease() {
            // When the user releases a block
            console.log('onRelease')
            if (this.tempblock2) {
                this.tempblock2.classList.remove("blockdisabled");
            }
        },
        onSnap(block, first, parent) {
            // When a block snaps with another one
            console.log('onSnap', block, first, parent)

            // block.innerHTML += '<component :is="TmpVueItem"></component>'
            // block['v-html'] = '<component :is="TmpVueItem"></component>'
            // block.innerHTML = Vue.h('TmpVueItem')
            // return true
            block.classList.remove('flowly_block_li')
            // var grab = block.querySelector(".grabme");
            // grab.parentNode.removeChild(grab);
            // var blockin = block.querySelector(".blockin");
            // blockin.parentNode.removeChild(blockin);
            const mimeValue = block.querySelector(".blockelemtype").value
            if (mimeValue == "1") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/eyeblue.svg'><p class='blockyname'>New visitor</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When a <span>new visitor</span> goes to <span>Site 1</span></div>";
            } else if (mimeValue == "2") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/actionblue.svg'><p class='blockyname'>Action is performed</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>Action 1</span> is performed</div>";
            } else if (mimeValue == "3") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/timeblue.svg'><p class='blockyname'>Time has passed</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>10 seconds</span> have passed</div>";
            } else if (mimeValue == "4") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/errorblue.svg'><p class='blockyname'>Error prompt</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>When <span>Error 1</span> is triggered</div>";
            } else if (mimeValue == "5") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/databaseorange.svg'><p class='blockyname'>New database entry</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add <span>Data object</span> to <span>Database 1</span></div>";
            } else if (mimeValue == "6") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/databaseorange.svg'><p class='blockyname'>Update database</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Update <span>Database 1</span></div>";
            } else if (mimeValue == "7") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/actionorange.svg'><p class='blockyname'>Perform an action</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Perform <span>Action 1</span></div>";
            } else if (mimeValue == "8") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/twitterorange.svg'><p class='blockyname'>Make a tweet</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Tweet <span>Query 1</span> with the account <span>@alyssaxuu</span></div>";
            } else if (mimeValue == "9") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/logred.svg'><p class='blockyname'>Add new log entry</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Add new <span>success</span> log entry</div>";
            } else if (mimeValue == "10") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/logred.svg'><p class='blockyname'>Update logs</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Edit <span>Log Entry 1</span></div>";
            } else if (mimeValue == "0") {
                block.innerHTML += "<div class='blockyleft'><img src='/flows/static/vendor/flowy/demo/assets/errorred.svg'><p class='blockyname'>Prompt an error</p></div><div class='blockyright'><img src='/flows/static/vendor/flowy/demo/assets/more.svg'></div><div class='blockydiv'></div><div class='blockyinfo'>Trigger <span>Error 1</span></div>";
            }
            return true;
        },
    },
    template: `
<div>
<!--    <div style="position: fixed; top: 50px; left: 50px; height: 400px; width: 200px" class="d-flex flex-column">-->
<!--        <button class="btn btn-secondary" @click="() => this.flowy_data = window.flowy.output()">get data</button>-->
<!--        <textarea>{{flowy_data}}</textarea>-->
<!--    </div>-->
    
    <div ref="flowy_canvas" class="flowly_canvas"></div>    
</div>
`
}