var wait_modal_needed = false;


$(function() {
  $("#wait-modal").on("shown.bs.modal", function (e) {
    if (!wait_modal_needed) {
      $("#wait-modal").modal("hide");
    }
  });
});


function flow_show_wait_modal() {
  wait_modal_needed = true;
  $("#wait-modal").modal("show");
}


function flow_hide_wait_modal() {
  wait_modal_needed = false;
  $("#wait-modal").modal("hide");
}