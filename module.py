#!/usr/bin/python3
# coding=utf-8

#   Copyright 2021 getcarrier.io
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

""" Module """
from pylon.core.tools import log  # pylint: disable=E0611,E0401
from pylon.core.tools import module  # pylint: disable=E0611,E0401

from tools import theme


class Module(module.ModuleModel):
    """ Task module """

    def __init__(self, context, descriptor):
        self.context = context
        self.descriptor = descriptor

    def init(self):
        """ Init module """
        log.info('Initializing AI Prompts module')

        self.descriptor.init_blueprint()
        self.descriptor.init_api()
        self.descriptor.init_slots()
        self.descriptor.init_rpcs()
        self.descriptor.init_events()

        from .init_db import init_db
        init_db()

        theme.register_subsection(
            "models", "flowy",
            "Flowy",
            title="Task Flow",
            kind="slot",
            prefix="new_flowy_",
            weight=2,
            permissions={
                "permissions": ["models.flowy"],
                "recommended_roles": {
                    "administration": {"admin": True, "editor": True, "viewer": True},
                    "default": {"admin": True, "editor": True, "viewer": True},
                }
            }
        )

    def deinit(self):  # pylint: disable=R0201
        """ De-init module """
        log.info('De-initializing')
