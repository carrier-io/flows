from flask import request
from tools import api_tools
from pydantic import ValidationError


class ProjectAPI(api_tools.APIModeHandler):

    def post(self, project_id: int):
        data = request.json
        try:
            result = self.module.create_workflow(project_id, data)
        except ValidationError as e:
            return e.errors(), 400
        return result, 200
    

    def get(self, project_id: int):
        result = self.module.list_workflows(project_id)
        return result, 200


class AdminAPI(api_tools.APIModeHandler):
    ...


class API(api_tools.APIBase):
    url_params = [
        '<string:mode>/<int:project_id>',
        '<int:project_id>',
    ]

    mode_handlers = {
        'default': ProjectAPI,
        'administration': AdminAPI,
    }
