var filter = []; 

$(function() {
  /*$("#flow-delete-modal").on("shown.bs.modal", function (e) {
    $("#flow-delete-part-buttons").hide();
    $("#flow-delete-part-processing").show();
    $.getJSON(
      filter_names_url+'/'+source_type, {}
    ).done(
      function(data) {
        $("#flow-delete-name").find("option").remove();
        data.forEach(function(filter) {
          $("#flow-delete-name").append("<option>" + filter.name + "</option>");
        });
        $("#flow-delete-part-processing").hide();
        $("#flow-delete-part-buttons").show();
      }
    );
  });

  $("#flow-delete-button").click(function () {
    $("#flow-delete-part-buttons").hide();
    $("#flow-delete-part-processing").show();
    var name = $("#flow-delete-name").val()
    $.ajax({
      url: filters_url + '/' + name,
      type: 'DELETE',
      success: function (response){
          $("#flow-delete-name").find("option").remove();
          $("#flow-delete-modal").modal("hide");
          callSuccessToast(response.msg)
      },
      error: function(response){
          let msg = response.responseJSON.msg;
          callErrorToast(msg)
      },
      dataType: "json",
      contentType: "application/json"
    });
  });

  $("#flow-load-modal").on("shown.bs.modal", function (e) {
    $("#flow-load-part-buttons").hide();
    $("#flow-load-part-processing").show();
    $.getJSON(
      filter_names_url+'/'+source_type, {}
    ).done(
      function(data) {
        $("#flow-load-name").find("option").remove();
        data.forEach(function(filter) {
          $("#flow-load-name").append("<option>" + filter.name + "</option>");
        });
        $("#flow-load-part-processing").hide();
        $("#flow-load-part-buttons").show();
      }
    );
  });

  $("#flow-load-button").click(function () {
    $("#flow-load-part-buttons").hide();
    $("#flow-load-part-processing").show();
    let name = $("#flow-load-name").val();
    $.getJSON(
      filters_url + '/' + name
    ).done(
      function(data) {
        // Restore filter state
        triage_restore_filter(data.filter)
        // Hide modal
        $("#flow-load-name").find("option").remove();
        $("#flow-load-modal").modal("hide");
      }
    );
  });*/
});
