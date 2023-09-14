import uuid

from flask import request
from tools import api_tools, db, auth, config as c
from ...models.flow import Flow

from pylon.core.tools import log

from ...utils.flow import FlowValidator, FlowExecutor
from ...utils.parser import FlowParser, InvalidTaskNames


class ProjectAPI(api_tools.APIModeHandler):
    @auth.decorators.check_api({
        "permissions": ["models.flows.flow.details"],
        "recommended_roles": {
            c.ADMINISTRATION_MODE: {"admin": True, "editor": True, "viewer": False},
            c.DEFAULT_MODE: {"admin": True, "editor": True, "viewer": False},
        }})
    def get(self, project_id: int, flow_id: int):
        # Flow details
        with db.with_project_schema_session(project_id) as session:
            flow_data = session.query(Flow).with_entities(Flow.flow_data).filter(Flow.id == flow_id).first()
            if not flow_data:
                return {'error': 'Flow data not found'}, 404
            return {'flow_data': flow_data[0]}, 200

    @auth.decorators.check_api({
        "permissions": ["models.flows.flow.run"],
        "recommended_roles": {
            c.ADMINISTRATION_MODE: {"admin": True, "editor": True, "viewer": False},
            c.DEFAULT_MODE: {"admin": True, "editor": True, "viewer": False},
        }})
    def post(self, project_id: int, flow_id: int):
        # Run flow and save if asked

        flow_data = request.json.get('flow_data')
        with db.with_project_schema_session(project_id) as session:
            if flow_data:
                session.query(Flow).filter(Flow.id == flow_id).update({Flow.flow_data: request.json['flow_data']})
                session.commit()
            else:
                flow_data = session.query(Flow).with_entities(Flow.flow_data).filter(Flow.id == flow_id).first()
                if not flow_data:
                    return {'error': 'Flow data not found'}, 404
                flow_data = flow_data[0]

        run_async = request.json.get('async', False)

        log.info('api got flow_data %s', flow_data)
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
            self.module.context.event_manager.fire_event('flows_run_flow', backend_config)
        else:
            log.info('FlowExecutor %s', backend_config)
            flow = FlowExecutor(self.module, backend_config)
            log.info('Running flow')
            result = flow.run()
        return {"ok": True, "config": backend_config, "result": result}, 200

    @auth.decorators.check_api({
        "permissions": ["models.flows.flow.update"],
        "recommended_roles": {
            c.ADMINISTRATION_MODE: {"admin": True, "editor": True, "viewer": False},
            c.DEFAULT_MODE: {"admin": True, "editor": True, "viewer": False},
        }})
    def put(self, project_id: int, flow_id: int):
        # Update flow
        with db.with_project_schema_session(project_id) as session:
            session.query(Flow).filter(Flow.id == flow_id).update({Flow.flow_data: request.json['flow_data']})
            session.commit()
            return {'id': flow_id}, 204

    @auth.decorators.check_api({
        "permissions": ["models.flows.flow.delete"],
        "recommended_roles": {
            c.ADMINISTRATION_MODE: {"admin": True, "editor": True, "viewer": False},
            c.DEFAULT_MODE: {"admin": True, "editor": True, "viewer": False},
        }})
    def delete(self, project_id: int, flow_id: int):
        # Delete flow
        with db.with_project_schema_session(project_id) as session:
            session.query(Flow).filter(Flow.id == flow_id).delete()
            session.commit()
            return {'id': flow_id}, 204


class API(api_tools.APIBase):
    url_params = [
        '<int:project_id>/<int:flow_id>',
        '<string:mode>/<int:project_id>/<int:flow_id>',
    ]

    mode_handlers = {
        c.DEFAULT_MODE: ProjectAPI,
    }
