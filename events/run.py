from ..utils.flow import Flow
from pylon.core.tools import log, web


class Event:
    @web.event("flows_node_finished")
    def node_finished(self, context, event, payload):
        context.sio.emit("flows_node_finished", payload)

    @web.event("flows_run_flow")
    def run_flow(self, context, event, data):
        flow = Flow(self, data)
        flow.run()
