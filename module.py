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
from pylon.core.tools import module, log

from tools import theme


class Module(module.ModuleModel):
    """ Task module """

    def __init__(self, context, descriptor):
        self.context = context
        self.descriptor = descriptor

    def init(self):
        """ Init module """
        log.info('Initializing Flows module')

        from .init_db import init_db
        init_db(self.context.rpc_manager)

        self.descriptor.init_all()

        theme.register_subsection(
            "models", "flows",
            "Flows",
            title="Flows",
            kind="slot",
            prefix="flows_",
            weight=3,
            permissions={
                "permissions": ["models.flows"],
                "recommended_roles": {
                    "administration": {"admin": True, "editor": True, "viewer": False},
                    "default": {"admin": True, "editor": True, "viewer": False},
                }
            }
        )

        self.init_flows()


    def deinit(self):  # pylint: disable=R0201
        """ De-init module """
        log.info('De-initializing')

    def init_flows(self) -> None:
        from .flows import start, start_validate, pause, pause_validate, evaluate, evaluate_validate
