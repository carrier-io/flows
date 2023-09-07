from pydantic import BaseModel, ValidationError, root_validator, validator
from typing import List


class WorkflowModel(BaseModel):
    name: str
    flow_data: dict = {}
    display_data: dict = {}


class WorkflowUpdateModel(WorkflowModel):
    id: int


class Variable(BaseModel):
    name: str
    type: str
    value: str

    @validator('value')
    def validate_value(cls, value, values):
        type_validators = {
            'string': cls.validate_string,
            'float': cls.validate_float,
            'integer': cls.validate_integer,
            'boolean': cls.validate_bool,
        }
        v_type = values['type']
        
        if v_type in type_validators:
            return type_validators[v_type](value)
        else:
            raise ValueError(f"Unknown variable type: {v_type}")

    @classmethod
    def validate_string(cls, value):
        return value

    @classmethod
    def validate_float(cls, value):
        try:
            return float(value)
        except ValueError:
            raise ValueError(f"Invalid float value: {value}")

    @classmethod
    def validate_integer(cls, value):
        try:
            return int(value)
        except ValueError:
            raise ValueError(f"Invalid integer value: {value}")

    @classmethod
    def validate_bool(cls, value):
        if value.lower() in ('true', 'false'):
            return value.lower() == 'true'
        else:
            raise ValueError(f"Invalid boolean value: {value}")