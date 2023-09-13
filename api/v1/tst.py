import uuid

from flask import request
from tools import api_tools, db, auth, config as c
from ...models.flow import Flow
from tools import flow_tools
from pylon.core.tools import log

from ...utils.flow import FlowValidator, FlowExecutor
from ...utils.parser import FlowParser, InvalidTaskNames


class ProjectAPI(api_tools.APIModeHandler):
    def get(self, project_id: int):
        return flow_tools._registry, 200

    def post(self, project_id):
        flow_data = dict(request.json)
        run_async = flow_data.pop('async', False)

        try:
            parser = FlowParser(flow_data)
            backend_config = parser.parse()
        except InvalidTaskNames as e:
            return {
                "ok": False,
                "error": {
                    "msg": str(e),
                    "invalid_names": e.invalid_names,
                },
                "type": "parse_error"
            }

        backend_config['project_id'] = project_id
        backend_config['run_id'] = str(uuid.uuid4())

        log.info('Validating flow %s', backend_config)
        validator = FlowValidator(self.module, backend_config)
        errors = validator.validate()
        if errors:
            response = {"ok": False, "errors": errors, "type": "validation_error"}
            return response, 400
        log.info('Validating passed')

        backend_config['variables'] = validator.variables

        result = None
        if run_async:
            self.module.context.event_manager.fire_event('run_workflow', backend_config)
        else:
            log.info('FlowExecutor %s', backend_config)
            flow = FlowExecutor(self.module, backend_config)
            log.info('Running flow')
            result = flow.run()
        return {"ok": True, "config": backend_config, "result": result}, 200


class API(api_tools.APIBase):
    url_params = [
        '<int:project_id>',
        '<string:mode>/<int:project_id>',
    ]

    mode_handlers = {
        c.DEFAULT_MODE: ProjectAPI,
    }
