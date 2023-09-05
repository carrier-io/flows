const getWorkflowsUrl = () => {
    return `${V.build_api_url('flows', 'workflows')}/${getSelectedProjectId()}`
}

const getWorkflowUrl = () => {
    return `${V.build_api_url('flows', 'workflow')}/${getSelectedProjectId()}`
}

const ApiExecuteFlow = async (payload) => {
    const api_url = V.build_api_url('flows', 'execute')
    const res = await fetch(`${api_url}/${getSelectedProjectId()}`, {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(payload),
        
    })
    return res.json();
}


const ApiSaveFlow = async (payload) => {
    const api_url = `${V.build_api_url('flows', 'workflows')}/${getSelectedProjectId()}`
    $.ajax({
        url: api_url,
        type: 'POST',
        data: JSON.stringify(payload),
        success: function(response) {
            $("#flow-save-part-processing").hide();
            $("#flow-save-part-buttons").show();
            $("#flow-save-name").val("");
            $("#flow-modal").modal("hide");
            showNotify("SUCCESS", response.msg)
        },
        error: function(response){
            $("#flow-save-part-processing").hide();
            $("#flow-save-part-buttons").show();
            $("#flow-save-name").val("");
            $("#flow-modal").modal("hide");
            showNotify("ERROR", response.responseJSON.error)
        },
        dataType: "json",
        contentType: "application/json"
    });
}


const ApiLoadFlow = async (doneCallback) => {
    const api_url = `${V.build_api_url('flows', 'workflows')}/${getSelectedProjectId()}`
    $.get(api_url)
        .done((resp) => {
            doneCallback(resp, $("#flow-name"))
        })
}