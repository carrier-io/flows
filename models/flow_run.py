from sqlalchemy.orm import relationship, backref
from ..constants import FlowStatuses
from sqlalchemy import Integer, Column, String, DateTime, func, JSON, ForeignKey, Boolean
from tools import db_tools, db


class FlowRun(
    db_tools.AbstractBaseMixin, db.Base
):
    __tablename__ = "flow_run"
    __table_args__ = {'schema': 'tenant'}

    id = Column(Integer, primary_key=True)
    uid = Column(String(128), unique=True, nullable=False)
    flow_data = Column(JSON, nullable=False)

    steps = Column(JSON, nullable=False)
    step_status = Column(JSON, unique=False, nullable=False, default=dict())

    is_async = Column(Boolean, nullable=False)
    validated_data = Column(JSON, nullable=False, default=dict())
    variables = Column(JSON, nullable=False, default=dict())

    started_at = Column(DateTime, nullable=False, server_default=func.now())
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(32), unique=False, nullable=False, default=FlowStatuses.running)

    flow_id = Column(Integer, ForeignKey('tenant.flow.id'), nullable=True)
    flow = relationship('Flow', backref=backref('runs', lazy=True))
