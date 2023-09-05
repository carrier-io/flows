from typing import List
from pylon.core.tools import web, log

from tools import db

# from ..models.serializers.workflow import workflow_schema, workflows_schema
from ..models.pd.flow import WorkflowModel, WorkflowUpdateModel
from ..models.workflow import Workflow


class RPC:
    @web.rpc("flowy_get_workflow", "get_workflow")
    def flowy_get_workflow_by_prompt_id(
            self, project_id: int, id: int, **kwargs
    ) -> List[dict]:
        with db.with_project_schema_session(project_id) as session:
            workflow = session.query(Workflow).get(id)
            return workflow

    @web.rpc("flowy_list_workflow", "list_workflows")
    def flowy_list_workflows(self, project_id: int) -> List[dict]:
        with db.with_project_schema_session(project_id) as session:
            workflows = session.query(Workflow).all()
            # return workflows_schema.dump(workflows)


    @web.rpc(f'flowy_create_workflow', "create_workflow")
    def flowy_create_workflow(self, project_id: int, payload: dict, **kwargs) -> dict:
        workflow = WorkflowModel.validate(payload)
        with db.with_project_schema_session(project_id) as session:
            workflow = Workflow(**workflow.dict())
            session.add(workflow)
            session.commit()
            # return workflow_schema.dump(workflow)
    

    @web.rpc(f'flowy_update_workflow', "update_workflow")
    def flowy_update_workflow(self, project_id: int, workflow: dict, **kwargs) -> bool:
        workflow = WorkflowUpdateModel.validate(workflow)
        with db.with_project_schema_session(project_id) as session:
            session.query(Workflow).filter(workflow.id == workflow.id).update(
                workflow.dict(exclude={'id'}, exclude_none=True)
            )
            session.commit()
            updated_workflow = session.query(Workflow).get(workflow.id)
            # return workflow_schema.dump(updated_workflow)


    @web.rpc(f'flowy_delete_workflow', "delete_workflow")
    def flowy_delete_workflow(self, project_id: int, workflow_id: int, **kwargs) -> None:
        with db.with_project_schema_session(project_id) as session:
            workflow = session.query(Workflow).get(workflow_id)
            if workflow:
                session.delete(workflow)
                session.commit()
