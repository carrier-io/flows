class FormFieldGen {
    constructor(name, meta){
        if (!name){
            console.log("ERROR: invalid field name")
            return
        }
        this.name = name
        this.meta = meta
    }

    genFieldTag(){
        let main = `<div class="form-row"><div class="form-group col">`
        let labelText = `<label class="inputlabel">${this.meta.displayName ? this.meta.displayName : this.name}</label>`
        let lowerText = `</div></div>`
        let inputText = ``

        switch(this.meta.tag){
            case 'select':
                inputText = this.genSelectTag()
                break;
            case 'input':
                inputText = this.genInputTag()
                break;
            case 'textarea':
                inputText = this.genTextAreaTag()
                break;
            default:
                inputText = this.genInputTag()
                break;
        }
        main += labelText
        main += inputText
        main += lowerText
        return main
    }

    getOpeningClosingTags(){
        let openningTag =`<${this.meta.tag} `         
        let closingTag = `</${this.meta.tag}> `
        openningTag += `class="form-control input-param" name='${this.name}' `
        // assinging props
        for (let attr in this.meta.attrs){
            openningTag += `${attr}="${this.meta.attrs[attr]}" `
        }
        return  {"openning": openningTag, "closing":closingTag}
    }

    genTextAreaTag(){
        let tags = this.getOpeningClosingTags()
        tags.openning += `>`
        if (!this.meta.value)
            return tags.openning + tags.closing
        return tags.openning + this.meta.value + tags.closing
    }

    genInputTag(){
        let tags = this.getOpeningClosingTags()
        let datalistText = `<datalist id="defaults"><option value="infer_from_context"></datalist>`
        tags.closing += datalistText           
        tags.openning += 'list="defaults" '
        if (this.meta.value){
            tags.openning += `value='${this.meta.value}' `
        }
        tags.openning += `>`
        return tags.openning + tags.closing
    }

    genSelectTag(){
        let tags = this.getOpeningClosingTags()
        let options = `<option value="infer_from_context">Infer from context</option>`
        for (let choice in this.meta.choices){
            if (choice == this.meta.value){
                options += `<option value="${choice}" selected>${this.meta.choices[choice]}</option>`
                continue
            }
            options += `<option value="${choice}">${this.meta.choices[choice]}</option>`
        }
        tags.openning += ">"
        return tags.openning + options + tags.closing
    }
}

const FlowBoard = {
    data() {
        return {
            wait_modal_needed: false,
            rpcs: {
                'first': {
                    'display_name': "First Function",
                    'params': []
                }
            }
        }
    },
    mounted() {
        $(document).on('vue_init', () => {
            var rightcard = false;
            var tempblock;
            var tempblock2;
            flowy(document.getElementById("canvas"), drag, release, snapping, this.onRearrange);
            function addEventListenerMulti(type, listener, capture, selector) {
                var nodes = document.querySelectorAll(selector);
                for (var i = 0; i < nodes.length; i++) {
                    nodes[i].addEventListener(type, listener, capture);
                }
            }
            function snapping(drag, first, parent) {
                // identifying step number
                if (first){
                    stepNumber = 1
                } else {
                    stepNumber = parseInt(parent.querySelector(".blockelemtype").dataset.stepNumber) + 1
                }
                var grab = drag.querySelector(".grabme");
                grab.parentNode.removeChild(grab);
                var blockin = drag.querySelector(".blockin");
                blockin.parentNode.removeChild(blockin);
                rpcInternalName = drag.querySelector(".blockelemtype").dataset.rpcInternalName;
                drag.innerHTML += `
                    <div class='blockyleft'>
                        <img src="{{url_for('flows.static', filename='img/actionblue.svg')}}">
                        <p class='blockyname'>${drag.querySelector(".blockelemtype").dataset.rpcName}</p>
                    </div>
                    <div class='blockyright'>
                        <img src="{{url_for('flows.static', filename='img/more.svg')}}">
                    </div>
                    <div class='blockydiv'></div>
                    <div class='blockyinfo'>${rpcInternalName}</div>
                `;
                // Filling flow data 
                rpcParams = getRpcParams(drag)
        
                taskSerialNumber += 1
                taskId = rpcInternalName + taskSerialNumber;
                drag.querySelector(".blockelemtype").dataset.taskId = taskId
                drag.querySelector(".blockelemtype").dataset.stepNumber = stepNumber
                if (parent){
                    parentTaskId = parent.querySelector(".blockelemtype").dataset.taskId
                    parentParentList = Array.from(flowData['tasks'][parentTaskId]['parent_list'])
                    parentParentList.push(parentTaskId)
                    flowData['tasks'][taskId] = {
                        "rpc_name":rpcInternalName,
                        "params":rpcParams,
                        "step":stepNumber,
                        "parent": parentTaskId,
                        "parent_list": parentParentList,
                    }
                }
                else {
                    flowData['tasks'][taskId] = {
                        "rpc_name":rpcInternalName,
                        "params":rpcParams,
                        "step":stepNumber,
                        "parent": null,
                        "parent_list": [],
                    }
                }
                return true;
            }
            function drag(block) {
                block.classList.add("blockdisabled");
                tempblock2 = block;
            }
            function release(e) {
                if (tempblock2) {
                    tempblock2.classList.remove("blockdisabled");
                }
            }
            var disabledClick = function(){
                document.querySelector(".navactive").classList.add("navdisabled");
                document.querySelector(".navactive").classList.remove("navactive");
                this.classList.add("navactive");
                this.classList.remove("navdisabled");
                if (this.getAttribute("id") == "actions") {
                    document.getElementById("blocklist").innerHTML = `
                        {% for name, rpc in rpcs.items() %}
                            <div class="blockelem create-flowy noselect">
                                <input 
                                    type="hidden" 
                                    name='blockelemtype' 
                                    class="blockelemtype" 
                                    value="{{loop.index}}"
                                    data-rpc-internal-name="{{name}}"
                                    data-rpc-name="{{rpc.display_name}}"
                                    data-rpc-params='{{rpc.params | tojson}}'
                                >
                                <div class="grabme">
                                    <img src="{{ url_for('flows.static', filename='img/grabme.svg') }}">
                                </div>
                                <div class="blockin">
                                    <div class="blockico">
                                        <span></span>
                                        <img src="{{ url_for('flows.static', filename='img/action.svg') }}">
                                    </div>
                                    <div class="blocktext">
                                        <p class="blocktitle">{{rpc.display_name}}</p>
                                        <p class="blockdesc">{{name}}</p>
                                    </div>
                                </div>
                            </div>
                        {% endfor %}
                    `
                } else if (this.getAttribute("id") == "flow_control") {
                    document.getElementById("blocklist").innerHTML = `
                        <div class="blockelem create-flowy noselect">
                            <input 
                                type="hidden" 
                                name='blockelemtype' 
                                class="blockelemtype" 
                                data-rpc-internal-name="_if_"
                                data-rpc-name="IF"
                            >
                            <div class="grabme">
                                <img src="{{ url_for('flows.static', filename='img/grabme.svg') }}">
                            </div>
                            <div class="blockin">
                                <div class="blockico">
                                    <span></span>
                                    <img src="{{ url_for('flows.static', filename='img/action.svg') }}">
                                </div>
                                <div class="blocktext">
                                    <p class="blocktitle">IF</p>
                                    <p class="blockdesc">If statement to control flow</p>
                                </div>
                            </div>
                        </div>` 
                }
            }
            
            addEventListenerMulti("click", disabledClick, false, ".side");
            document.getElementById("close").addEventListener("click", function(){
               if (rightcard) {
                   rightcard = false;
                   saveInputData()
                   document.getElementById("properties").classList.remove("expanded");
                   setTimeout(function(){
                        document.getElementById("propwrap").classList.remove("itson"); 
                   }, 300);
                    tempblock.classList.remove("selectedblock");
               }
            });
            
            document.getElementById("removeblock").addEventListener("click", function(){
                flowy.deleteBlocks();
                flowData = {"output":null, "tasks":{}, };
                document.getElementById("close").click()
            });
            
            var aclick = false;
            var noinfo = false;
            var beginTouch = function (event) {
                aclick = true;
                noinfo = false;
                if (event.target.closest(".create-flowy")) {
                    noinfo = true;
                }
            }
            var checkTouch = function (event) {
                aclick = false;
            }
            var doneTouch = function (event) {
                if (event.type === "mouseup" && aclick && !noinfo) {
                if (!rightcard && event.target.closest(".block") && !event.target.closest(".block").classList.contains("dragging")) {
                        tempblock = event.target.closest(".block");
                        
                        // generating RPC function params form
                        text = generateParams(tempblock)
                        
                        $("#proplist").append(text)
                        
                        // registering input field handlers
                        $('.input-param').change((e)=>{
                            paramName = e.target.name
                            taskId = tempblock.querySelector(".blockelemtype").dataset.taskId
                            flowData['tasks'][taskId]['params'][paramName]['value'] = e.target.value
            
                        })
                        //
                        rightcard = true;
                        document.getElementById("properties").classList.add("expanded");
                        document.getElementById("propwrap").classList.add("itson");
                        tempblock.classList.add("selectedblock");
                } 
                }
            }
            addEventListener("mousedown", beginTouch, false);
            addEventListener("mousemove", checkTouch, false);
            addEventListener("mouseup", doneTouch, false);
            addEventListenerMulti("touchstart", beginTouch, false, ".block");
        

            $("#wait-modal").on("shown.bs.modal", function (e) {
                if (!this.wait_modal_needed) {
                  $("#wait-modal").modal("hide");
                }
            });
    
            $("#sidebarToggleTop").trigger("click");
            $("nav").removeClass("mb-4");
    
            $("#close").click(() => {
                $("#proplist").empty()
                $('div.block.selectedblock').removeClass("selectedblock")
            })
    
            $('#alertprop').click(()=>{
                saveInputData()
                console.log(flowData)
    
                // cleaning props
                $("#proplist").empty()
    
                // enabling output field
                taskId = getTaskId()
                outputMeta = {
                    'tag': 'input',
                    'attrs':{'type':'text'},
                    'value':flowData['output'],
                    'displayName': 'Log File Path',
                }
                text = new FormFieldGen('logFilePath', outputMeta).genFieldTag()
                $("#proplist").append(text)
                $('.input-param').change((e) => {
                    flowData['output'] = e.target.value
                })
                // filling value in the input
                if (flowData['output']) {
                    $(`input[name|='logFilePath']`).val(flowData['output'])
                }
            });
    
            $('#dataprop').click(()=>{
                saveInputData()
                console.log(flowData)
    
                // cleaning props
                $("#proplist").empty()
    
                // enabling param fields
                params = flowData['tasks'][taskId]['params']
                text = "<form>"
                for (key in params){
                    text += new FormFieldGen(key, params[key]).genFieldTag()
                }
                text += "</form>"
                $("#proplist").append(text)
    
                // registering input field handlers
                $('.input-param').change((e)=>{
                    paramName = e.target.name
                    flowData['tasks'][taskId]['params'][paramName]['value'] = e.target.value
                })
            })
            
            $('#run').click(()=>{
                $.ajax({
                    type: "POST",
                    url: run_url,
                    data: JSON.stringify(flowData),
                    success: resp => {
                        console.log(resp)
                    },
                    dataType: "json",
                    contentType: "application/json"
                });
            })
    
            socket.on("flow_started", (data) => {
                callSuccessToast("Workflow has been started")
            });
    
            socket.on("task_executed", (data) => {
                data = JSON.parse(data)
                if (data["ok"] == true){
                    callSuccessToast(
                        `${data['task_id']} completed!` 
                    )
                }
                else {
                    callErrorToast(
                        `${data['task_id']} is failed! Reason: ${data['error']}`
                    )
                }
            });


            $("#flow-save-button").click(function () {
                $("#flow-save-part-buttons").hide();
                $("#flow-save-part-processing").show();
                var data = {
                    "name": $("#flow-save-name").val(),
                    "flow_data": flowData,
                    "display_data": flowy.output(), 
                };
                $.ajax({
                    url: workflows_url,
                    type: 'POST',
                    data: JSON.stringify(data),
                    success: function(response) {
                        $("#flow-save-part-processing").hide();
                        $("#flow-save-part-buttons").show();
                        $("#flow-save-name").val("");
                        $("#flow-modal").modal("hide");
                        callSuccessToast(response.msg);
                    },
                    error: function(response){
                        $("#flow-save-part-processing").hide();
                        $("#flow-save-part-buttons").show();
                        $("#flow-save-name").val("");
                        $("#flow-modal").modal("hide");
                        callErrorToast(response.responseJSON.error)
                    },
                    dataType: "json",
                    contentType: "application/json"
                });
            
            });
            
            $("#load").click(() =>{
                $("#flow-name").css("display", "block")
                $("#flow-save-name").css("display", "none")
                $("#flow-modal-label").text("Load Workflow")
                this.enableBtnOnModal("flow-load-button")
    
                // call to backend to get list of workflows
                $.get(workflows_url)
                    .done((resp) => {
                        this.populateWorkflowNames(resp, $("#flow-name"))
                    })
            });
    
            $("#flow-modal").on("hidden.bs.modal", function(e){
                this.clearWorkflowNames()
            })
    
            $("#flow-load-button").click(function(e){
                id = $("#flow-name").val()
                this.restoreWorkflow(id, workflow_url)
                $("#flow-modal").modal("hide")
                
            })
    
            $("#delete").click(() => {
                $("#flow-name").css("display", "block")
                $("#flow-save-name").css("display", "none")
                $("#flow-modal-label").text("Delete Workflow")
                this.enableBtnOnModal("flow-delete-button")
    
                // call to backend to get list of workflows
                $.get(workflows_url)
                    .done((resp) => {
                        this.populateWorkflowNames(resp, $("#flow-name"))
                    })
            })
    
            $("#flow-delete-button").click((e) => {
                id = $("#flow-name").val()
                url = workflow_url + '/' + id
                $.ajax({
                    url: url,
                    type: 'DELETE',
                    success: function(response) {
                        $("#flow-save-part-processing").hide();
                        $("#flow-save-part-buttons").show();
                        $("#flow-save-name").val("");
                        $("#flow-modal").modal("hide");
                        this.callSuccessToast(response.msg);
                    },
                    error: function(response){
                        $("#flow-save-part-processing").hide();
                        $("#flow-save-part-buttons").show();
                        $("#flow-save-name").val("");
                        $("#flow-modal").modal("hide");
                        this.callErrorToast(response.responseJSON.error)
                    },
                    dataType: "json",
                    contentType: "application/json"
                });
            })
    
            $("#save").click(()=> {
                $("#flow-name").css("display", "none")
                $("#flow-save-name").css("display", "block")
                $("#flow-modal-label").text("Save Workflow")
                this.enableBtnOnModal("flow-save-button")
            })
        })
    },
    methods: {
        enableBtnOnModal(enabledBtnId){
            // disable all
            $("#flow-delete-button").css("display", "none")
            $("#flow-load-button").css("display", "none")
            $("#flow-save-button").css("display", "none")

            // enable right btn
            $("#"+enabledBtnId).css("display", "block")
            
        },

        populateWorkflowNames(workflows, parentTag){
            txt = ""
            workflows.forEach((workflow) => {
                txt += `<option value="${workflow.id}">${workflow.name}</option>`
            })
            parentTag.append(txt)
        },

        clearWorkflowNames(){
            $("#flow-name").empty()
        },

        restoreWorkflow(workflowId, workflowUrl){
            $.get(workflowUrl + '/' + workflowId)
                .done(resp => {
                    flowData = resp['flow_data']
                    displayData =  resp['display_data']
                    this.drawOnBoard(displayData);
                })
        },

        drawOnBoard(displayData){
            flowy.deleteBlocks()
            flowy.import(displayData)
        },

        show_wait_modal() {
            this.wait_modal_needed = true;
            $("#wait-modal").modal("show");
        },

        hide_wait_modal() {
            this.wait_modal_needed = false;
            $("#wait-modal").modal("hide");
        },

        getInputTag(name, meta){
            // declering boilerplate part
            main = `<div class="form-row"><div class="form-group col">`
            labelText = `<label class="inputlabel">${meta.displayName ? meta.displayName : name}</label>`
            lowerText = `</div></div>`
            datalistText = `<datalist id="defaults"><option value="infer_from_context"></datalist>`
            inputText = ``
            
            // determining input field tag text
            if (meta.tag != 'select'){
                openningTagText =`<${meta.tag} `         
                closingTagText = `</${meta.tag}> `
                openningTagText += `class="form-control input-param" `
                for (attr in meta.attrs){
                    openningTagText += `${attr}="${meta.attrs[attr]}" `
                }
                openningTagText += `name='${name}' `
                if (meta.value){
                    openningTagText += `value='${meta.value}'`
                }
                // adding datalist option
                if (meta.tag == "input" && meta.attrs.type== "text"){
                    openningTagText += 'list="defaults" '  
                    closingTagText += datalistText
                }
                openningTagText += `>`
                inputText = openningTagText + closingTagText
        
            } else {
                inputText = getSelectTag(name, meta)
            }
            // summing all text    
            main += labelText
            main += inputText
            main += lowerText
            return main
        },

        getRpcParams(block){
            const json = block.querySelector(".blockelemtype").dataset.rpcParams;
            const obj = JSON.parse(json);
            flatObj = this.makeFlatNestedObject(obj)
            return flatObj   
        },

        generateParams(block){
            flatObj = this.getRpcParams(block)
            taskId = block.querySelector(".blockelemtype").dataset.taskId
            text = "<form>"
            params = flowData['tasks'][taskId]['params']
            for (key in params){
                text += new FormFieldGen(key, params[key]).genFieldTag()
            }
            text += "</form>"
            return text
        },

        makeFlatNestedObject(ob){
            let result = {};
            for (const i in ob) {
                if (ob[i]['nested_params']) {
                    delete ob[i]['nested_params']
                    const temp = makeFlatNestedObject(ob[i]);
                    for (const j in temp) {
                        result[i + '.' + j] = temp[j];
                    }
                }
                else {
                    delete ob[i]['nested_params']
                    result[i] = ob[i];
                }
            }
            return result;
        },

        onRearrange(block, parent){
            // deleting current task entry
            currentTaskId = block.querySelector(".blockelemtype").dataset.taskId
            delete flowData['tasks'][currentTaskId]
            
            // delete children entries
            for (taskId in flowData.tasks){
                if (flowData['tasks'][taskId]['parent_list'].includes(currentTaskId)){
                    delete flowData['tasks'][taskId]
                }
            }
        },

        getTaskId(){
            return $('div.block.selectedblock > .blockelemtype').data("taskId")
        },

        saveInputData(){
            $(".input-param").each((index, elem) => {
                taskId = this.getTaskId()
                if (!taskId) return 
                value = elem.value ? elem.value : null
                if (elem.name != "logFilePath"){
                    name = elem.name
                    flowData['tasks'][taskId]['params'][name]['value'] = value
                }
                else {
                    flowData['output'] = value
                }   
            })
        },

    },
    template: `
    <div id="content">
    <div class="container-fluid">
      <div id="leftcard">
        <div id="closecard">
            <img src="{{ url_for('flows.static', filename='img/closeleft.svg') }}">
        </div>
        <div class="float-right mr-2">
            <button id="run" type="button" class="btn btn-success">
                Run
            </button>
        </div>
        <div class="float-right mr-1">
            <button id="save" type="button" data-toggle="modal" data-target="#flow-modal" class="btn btn-primary">
                Save
            </button>
        </div>
        <div class="float-right mr-1">
            <button id="load" type="button" data-toggle="modal" data-target="#flow-modal" class="btn btn-primary">
                Load
            </button>
        </div>
        <div class="float-right mr-1">
            <button id="delete" type="button" data-toggle="modal" data-target="#flow-modal" class="btn btn-danger">
                Delete
            </button>
        </div>
        <p id="header">Blocks</p>
        
        <div id="search">
            <img src="{{ url_for('flows.static', filename='img/search.svg') }}">
            <input type="text" placeholder="Search blocks">
        </div>
        <div id="subnav">
            <div id="triggers" class="navactive side">Triggers</div>
            <div id="actions" class="navdisabled side">Actions</div>
            <div id="flow_control" class="navdisabled side">Control Flow</div>
        </div>
        <div id="blocklist">
            <div v-for="(name, rpc) in rpcs" :key="name">
                <div class="blockelem create-flowy noselect">
                    <input 
                        type="hidden" 
                        name='blockelemtype' 
                        class="blockelemtype" 
                        :value="name" 
                        data-rpc-internal-name="{{name}}"
                        data-rpc-name="{{rpc.display_name}}"
                        data-rpc-params='{{rpc.params | tojson}}'
                    >
                    <div class="grabme">
                        <img src="{{ url_for('flows.static', filename='img/grabme.svg') }}">
                    </div>
                    <div class="blockin">
                        <div class="blockico">
                            <span></span>
                            <img src="{{ url_for('flows.static', filename='img/action.svg') }}">
                        </div>
                        <div class="blocktext">
                            <p class="blocktitle">{{rpc.display_name}}</p>
                            <p class="blockdesc">{{name}}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      <div id="propwrap">
        <div id="properties">
            <div id="close">
                <img src="{{ url_for('flows.static', filename='img/close.svg') }}">
            </div>
            <p id="header2">Properties</p>
            <div id="propswitch">
                <div id="dataprop">Input</div>
                <div id="alertprop">Output</div>
            </div>
            <div id="proplist">
                <!-- RPC function argument fields is generated here -->
            </div>
            <div id="divisionthing"></div>
            <div id="removeblock">Delete blocks</div>
        </div>
      </div>
      <div id="canvas">
      </div>
      
      <!-- Workflow save modal -->
        <div class="modal fade" id="flow-modal" tabindex="-1" aria-labelledby="flow-modal-label" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="flow-modal-label">Save Workflow</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="flow-save-part-buttons">
                        <div class="form-group">
                            <label for="flow-save-name">Name</label>
                            <input type="text" class="form-control" id="flow-save-name">
                            <select style="display:none" class="form-control" id="flow-name">
                            </select>
                            </div>
                                <button type="button" class="btn btn-primary" id="flow-save-button">Save</button>
                                <button style="display:none" type="button" class="btn btn-danger" id="flow-delete-button">Delete</button>
                                <button style="display:none" type="button" class="btn btn-primary" id="flow-load-button">Load</button>
                            </div>
                            <div id="flow-save-part-processing" style="display: none;">
                                <div class="d-flex align-items-center">
                                    <strong>Processing...</strong>
                                    <div class="spinner-border ml-auto" role="status" aria-hidden="true"></div>
                                </div>
                            </div>
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
    `
}

register_component('flow-board', FlowBoard)


