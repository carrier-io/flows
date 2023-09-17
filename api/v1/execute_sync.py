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
import flask
from tools import api_tools
from pylon.core.tools import log
import uuid
from ...utils.flow import FlowValidator, FlowExecutor
from ...utils.parser import FlowParser, InvalidTaskNames


class ProjectAPI(api_tools.APIModeHandler):  # pylint: disable=R0903
    """ API Resource """

    def post(self, project_id: int):
        data = flask.request.json

        try:
            parser = FlowParser(data)
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
        
        validator = FlowValidator(self.module, backend_config)
        errors = validator.validate()
        if errors:
            response = {"ok": False, "errors": errors, "type": "validation_error"}
            return response, 400
        
        backend_config['variables'] = validator.variables

        flow = FlowExecutor(self.module, backend_config)
        ok, output = flow.run()
        if not ok:
            return {"ok": False, "errors": output, "type": "runtime_error"}
        return {"ok": True, "result": output, "run_id": flow.run_id}, 200


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