from pydantic import BaseModel

class WorkflowModel(BaseModel):
    name: str
    flow_data: dict = {}
    display_data: dict = {}


class WorkflowUpdateModel(WorkflowModel):
    id: int
