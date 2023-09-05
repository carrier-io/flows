#!/usr/bin/python3
# coding=utf-8

#   Copyright 2022 getcarrier.io
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

""" API """
from tools import api_tools
from pylon.core.tools import log
# from ...models.serializers.workflow import workflow_schema


class ProjectAPI(api_tools.APIModeHandler):  # pylint: disable=R0903
    """ API Resource """

    def get(self, project_id, id):
        workflow = self.module.get_workflow(project_id, id)
        # return workflow_schema.dump(workflow), 200
    

    def delete(self, project_id, id):
        self.module.delete_workflow(project_id, id)
        return "", 204
    


class AdminAPI(api_tools.APIModeHandler):
    ...


class API(api_tools.APIBase):
    url_params = [
        '<string:mode>/<int:project_id>/<int:id>',
        '<int:project_id>/<int:id>',
    ]

    mode_handlers = {
        'default': ProjectAPI,
        'administration': AdminAPI,
    }
