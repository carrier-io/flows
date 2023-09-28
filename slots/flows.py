from pylon.core.tools import web, log
from tools import auth, theme


class Slot:

    @web.slot('flows_content')
    @auth.decorators.check_slot(['models.flows'], access_denied_reply=theme.access_denied_part)
    def content(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template('flows/content.html')

    @web.slot("flows_scripts")
    @auth.decorators.check_slot(["models.flows"])
    def scripts(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template('flows/scripts.html')

    @web.slot('flows_styles')
    @auth.decorators.check_slot(["models.flows"])
    def styles(self, context, slot, payload):
        with context.app.app_context():
            return self.descriptor.render_template('flows/styles.html')
