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

""" Slot """
from pylon.core.tools import web  # pylint: disable=E0611,E0401
from pylon.core.tools import log

from tools import auth, tasklib  # pylint: disable=E0401
from tools import theme  # pylint: disable=E0401


class Slot:  # pylint: disable=E1101,R0903
    """ Slot Resource """

    @staticmethod
    def get_tasks_meta(context):
        meta = tasklib.list_tasks_meta()
        return {
            name:{
                'display_name': entry[1],
                'params': entry[0]
            }
            for name, entry in meta.items()
        }


    @web.slot("new_flowy_content")
    @auth.decorators.check_slot(['models.flowy'], access_denied_reply=theme.access_denied_part)
    def _flow_content(self, context, slot, payload):
        _ = slot, payload
        data = Slot.get_tasks_meta(context)
        with context.app.app_context():
            return self.descriptor.render_template("flowy/content.html", rpcs=data)


    @web.slot("new_flowy_styles")
    @auth.decorators.check_slot(["models.flowy"])
    def _flow_styles(self, context, slot, payload):
        _ = slot, payload
        with context.app.app_context():
            return self.descriptor.render_template("flowy/styles.html")


    @web.slot("new_flowy_scripts")
    @auth.decorators.check_slot(["models.flowy"])
    def _flow_scripts(self, context, slot, payload):
        _ = slot, payload
        data = Slot.get_tasks_meta(context)
        with context.app.app_context():
            return self.descriptor.render_template("flowy/scripts.html", rpcs=data)