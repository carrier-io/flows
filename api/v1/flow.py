from flask import request
from tools import api_tools, db, auth, config as c
from ...models.flow import Flow

from pylon.core.tools import log


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
        # Run flow
        return {'error': 'Not implemented'}, 400

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
        'default': ProjectAPI,
    }
