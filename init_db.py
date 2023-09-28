from tools import db, rpc_tools
from pylon.core.tools import log


def init_db(rpc_manager):
    from .models.flow import Flow
    from .models.flow_run import FlowRun
    # rpc_manager = rpc_tools.RpcMixin().rpc
    project_list = rpc_manager.call.project_list()
    for i in project_list:
        with db.with_project_schema_session(i['id']) as tenant_db:
            db.get_tenant_specific_metadata().create_all(bind=tenant_db.connection())
            tenant_db.commit()
