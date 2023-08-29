from flask import request
from tools import api_tools
from pydantic import ValidationError
from ...models.serializers.workflow import workflow_schema, workflows_schema


class ProjectAPI(api_tools.APIModeHandler):

    def post(self, project_id: int):
        data = request.json
        try:
            workflow = self.module.create_workflow(project_id, data)
        except ValidationError as e:
            return e.errors(), 400
        return workflow_schema.dump(workflow), 200
    

    def get(self, project_id: int):
        workflows = self.module.list_workflows(project_id)
        return workflows_schema.dump(workflows), 200


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
