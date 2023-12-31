import json

from enum import Enum
from pydantic import BaseModel, validator, constr
from typing import List, Optional, Dict
from tools import flow_tools


class HTTPAction(Enum):
    GET = "get"
    POST = "post"
    PUT = "put"
    PATCH = "patch"
    DELETE = "delete"


class HTTPRequestType(Enum):
    TEXT = "text"
    JSON = "json"


class RequestPD(BaseModel):
    url: str
    action: HTTPAction
    headers: List[Dict[str, str]]
    output_type: Optional[str] = "string"
    request_type: Optional[HTTPRequestType] = HTTPRequestType.TEXT
    body: Optional[str] = None

    class Config:
        use_enum_values = True


class EvaluatePayload(BaseModel):
    eval_input: str | constr(regex=flow_tools.PLACEHOLDER_VARIABLE_REGEX)
    output_type: Optional[str] = "string"


class EndPayload(EvaluatePayload):
    eval_input: Optional[str] | constr(regex=flow_tools.PLACEHOLDER_VARIABLE_REGEX) = None 


class PausePayload(BaseModel):
    wait_time_ms: int


class Variable(BaseModel):
    name: str
    type: str
    value: str | int | float | bool | dict

    @validator('value')
    def validate_value(cls, value, values):
        type_validators = {
            'string': cls.validate_string,
            'integer': cls.validate_integer,
            'float': cls.validate_float,
            'boolean': cls.validate_bool,
            'json': cls.validate_json,
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

    @classmethod
    def validate_json(cls, value: str | dict) -> dict:
        if isinstance(value, str):
            return json.loads(value)
        return value
        

class StartPayload(BaseModel):
    variables: List[Variable]
