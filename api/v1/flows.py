from flask import request
from tools import api_tools, db, auth, config as c
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import load_only
from ...models.flow import Flow

from pylon.core.tools import log


class FlowListModel(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True


class ProjectAPI(api_tools.APIModeHandler):

    @auth.decorators.check_api({
        "permissions": ["models.flows.flows.list"],
        "recommended_roles": {
            c.ADMINISTRATION_MODE: {"admin": True, "editor": True, "viewer": False},
            c.DEFAULT_MODE: {"admin": True, "editor": True, "viewer": False},
        }})
    def get(self, project_id: int):
        with db.with_project_schema_session(project_id) as session:
            flows = session.query(Flow).options(load_only(Flow.id, Flow.name)).all()
            return [FlowListModel.from_orm(i).dict() for i in flows], 200

    @auth.decorators.check_api({
        "permissions": ["models.flows.flows.create"],
        "recommended_roles": {
            c.ADMINISTRATION_MODE: {"admin": True, "editor": True, "viewer": False},
            c.DEFAULT_MODE: {"admin": True, "editor": True, "viewer": False},
        }})
    def post(self, project_id: int):
        try:
            with db.with_project_schema_session(project_id) as session:
                flow = Flow(
                    name=request.json['name'],
                    flow_data=request.json.get('flow_data', {
                        "drawflow": {
                            "Home": {
                                "data": {}
                            }
                        }
                    }),
                )
                session.add(flow)
                session.commit()
                return FlowListModel.from_orm(flow).dict(), 200
        except IntegrityError:
            return {'error': f"Flow \"{request.json['name']}\" already exists"}, 400


class API(api_tools.APIBase):
    url_params = [
        '<int:project_id>',
        '<string:mode>/<int:project_id>',
    ]

    mode_handlers = {
        'default': ProjectAPI,
    }
