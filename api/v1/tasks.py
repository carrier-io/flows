from flask import request
from tools import api_tools
from pydantic import ValidationError
from tools import tasklib


class ProjectAPI(api_tools.APIModeHandler):

    def get(self, project_id: int):
        result = tasklib.list_tasks_meta()
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