from ..utils.flow import Flow
from pylon.core.tools import log, web


class Event:
    @web.event("task_executed")
    def _task_executed(self, context, event, payload):
        context.sio.emit("task_executed", payload)

    @web.event("run_workflow")
    def _run_workflow(self, context, event, data):
        flow = Flow(self, data)
        flow.validate_flow()
        flow.run_workflow()
