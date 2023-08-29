from sqlalchemy import Integer, Column, String, DateTime, func, JSON
from tools import db_tools, db


class Workflow(
    db_tools.AbstractBaseMixin, db.Base
):
    __tablename__ = "flowy_workflows"
    __table_args__ = {'schema': 'tenant'}

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    flow_data = Column(JSON, nullable=False)
    display_data = Column(JSON, nullable=False)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
