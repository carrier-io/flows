from ..constants import SioEvent
from ..utils.flow import FlowExecutor
from pylon.core.tools import log, web


class Event:
    @web.event("flows_run_flow")
    def run_flow(self, context, event, data):
        flow_id = data.pop('flow_id')
        flow = FlowExecutor(module=self, flow_id=flow_id, **data)
        result = {'run_id': flow.run_id}
        ok, run_output = flow.run()
        result['ok'] = bool(ok)
        if ok:
            result['result'] = run_output
        else:
            result['error'] = run_output
            result['type'] = 'execution_error'

        flow.emit_events(SioEvent.flow_finished, result)
