from ..constants import SioEvent
from ..utils.flow import FlowExecutor
from pylon.core.tools import log, web


class Event:
    @web.event("flows_node_finished")
    def node_finished(self, context, event, payload):
        context.sio.emit(SioEvent.node_finished, payload)

    @web.event("flows_run_flow")
    def run_flow(self, context, event, data):
        flow = FlowExecutor(module=self, **data)
        result = {'run_id': flow.run_id}
        ok, run_output = flow.run()
        result['ok'] = bool(ok)
        if ok:
            result['result'] = run_output
        else:
            result['error'] = run_output
            result['type'] = 'execution_error'

        context.sio.emit(SioEvent.flow_finished, result)
