from datetime import datetime
from typing import Optional

from pydantic import BaseModel, validator
from ...constants import NodeStatuses


def calculate_duration(start_time: Optional[datetime], finish_time: Optional[datetime]) -> Optional[float]:
    try:
        return (finish_time - start_time).total_seconds()
    except TypeError:
        ...


class NodeStatus(BaseModel):
    status: NodeStatuses = NodeStatuses.pending
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    duration: Optional[float]
    message: Optional[str]

    @validator('duration')
    def set_duration(cls, value: Optional[float], values: dict) -> Optional[float]:
        if value:
            return value
        return calculate_duration(values['started_at'], values['finished_at'])

    def update(self, other: 'NodeStatus') -> None:
        self.status = other.status
        self.message = other.message
        if other.started_at:
            self.started_at = other.started_at
        if other.finished_at:
            self.finished_at = other.finished_at
        if other.duration:
            self.duration = other.duration
        else:
            self.duration = calculate_duration(self.started_at, self.finished_at)

    def orm_dict(self):
        result = super().dict(exclude={'started_at', 'finished_at'})
        if self.started_at:
            result['started_at'] = self.started_at.isoformat(timespec='seconds')
        if self.finished_at:
            result['finished_at'] = self.finished_at.isoformat(timespec='seconds')
        return result
