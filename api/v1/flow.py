import uuid

from flask import request
from tools import api_tools, db, auth, config as c
from ...models.flow import Flow

from pylon.core.tools import log

from ...utils.flow import FlowValidator, FlowExecutor, change_start_node_variables
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
                    return {'error': 'Flow data not found'}, 400
                flow_data = flow_data[0]

        run_async = request.json.get('async', False)

        log.info('api got flow_data %s', flow_data)
        try:
            parsed_tasks_config = FlowParser(flow_data).parse()
        except InvalidTaskNames as e:
            return {
                "ok": False,
                "many": False,
                "error": {
                    "msg": str(e),
                    "invalid_names": e.invalid_names,
                },
                "type": "parse_error",
            }, 400
        except Exception as e:
            return {"ok": False, "error": str(e), "type": "parse_error"}, 400

        # backend_config['project_id'] = project_id
        # backend_config['run_id'] = str(uuid.uuid4())

        log.info('parsed_tasks_config %s', parsed_tasks_config)
        variables = request.json.get('variables')
        if variables:
            parsed_tasks_config = change_start_node_variables(parsed_tasks_config, variables)
        validator = FlowValidator(self.module, tasks=parsed_tasks_config, project_id=project_id)
        validator.validate()
        if not validator.ok:
            response = {"ok": False, "error": validator.errors, "type": "validation_error"}
            return response, 400

        # backend_config['variables'] = validator.variables

        result = {'ok': True, 'run_id': validator.run_id}
        if False:
            result['tasks'] = validator.tasks
            result['validated_data'] = {}
            pds = []
            for k, v in validator.validated_data.items():
                if isinstance(v, (str, dict, int, bool, list)):
                    result['validated_data'][k] = v
                elif getattr(v, 'dict'):
                    pds.append(str(k))
                    result['validated_data'][k] = v.dict()
                else:
                    result['validated_data'][str(k)] = str(v)
            result['pds'] = pds
            return result, 200
        if run_async:
            payload = {'flow_id': flow_id, 'sync': False, **validator.event_payload}
            self.module.context.event_manager.fire_event('flows_run_flow', payload)
        else:
            log.info('FlowExecutor %s', validator.validated_data)
            flow = FlowExecutor.from_validator(flow_id, validator, sync=True)
            log.info('Running flow')
            ok, run_output = flow.run()
            result['ok'] = bool(ok)
            if ok:
                result['result'] = run_output
            else:
                result['error'] = run_output
                result['type'] = 'execution_error'
        return result, 200 if result['ok'] else 400

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
