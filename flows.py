import random
from typing import Any

from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
from tools import rpc_tools, flow_tools
import requests
from .utils.evaluate import get_evaluator, EvaluateTemplate
from time import sleep

from pydantic import ValidationError
from .models.pd.flow import Variable, EvaluatePayload, StartPayload, PausePayload


# @web.rpc("flowy_make_request", "make_request")
def _make_request(method: str, jwt_token: str, url: str):
    headers = {}
    if jwt_token:
        headers['Authorization'] = f'Bearer {jwt_token}'
        headers['Content-Type'] = 'application/json'
    method = getattr(requests, method)
    response = method(url, headers=headers)
    if not response.status_code == 200:
        return {'ok': False, 'error': response.json()}
    return {"ok": True, 'result': response.json()}


@flow_tools.flow(
    uid='start',
    display_name='Start',
    tooltip='Start node',
    icon_fa='fa fa-terminal fa-xl',
    inputs=0,
    weight=100
)
def start(flow_context: dict, variables: list):
    variable_dict = {}
    for variable in variables:
        try:
            # Use Pydantic to validate and convert the variable
            variable = Variable(**variable)
            variable_dict[variable.name] = variable.value
        except ValidationError as e:
            return {"ok": False, "error": f"Error: {e}", "errors": e.errors()}
    return {"ok": True, 'result': variable_dict}


@flow_tools.validator(flow_uid='start')
def start_validate(**kwargs):
    log.info(f'rpc validator called {kwargs}')
    return StartPayload.validate(kwargs)


@flow_tools.flow(
    uid='evaluate',
    display_name='Evaluate',
    tooltip='Evaluate',
    icon_url='/flows/static/icons/evaluate.svg',
    weight=90
)
def evaluate(flow_context: dict, eval_input: str, output_type: str = 'string'):
    try:
        payload = flow_context.get('outputs')
        module = flow_context.get("module")
        evaluate_class = get_evaluator(output_type)
        evaluator: EvaluateTemplate = evaluate_class(module, eval_input, payload, output_type)
        result = evaluator.evaluate()
    except Exception as e:
        log.error(e)
        return {"ok": False, "error": str(e)}
    return {"ok": True, 'result': result}


@flow_tools.validator(flow_uid='evaluate')
def evaluate_validate(**kwargs):
    return EvaluatePayload.validate(kwargs)


@flow_tools.flow(
    uid='pause',
    display_name='Pause',
    tooltip='Wait',
    icon_url='/flows/static/icons/pause.svg',
    weight=89
)
def pause(flow_context: dict, wait_time_ms: int):
    try:
        sleep_time = float(wait_time_ms) / 1000
        sleep(sleep_time)
    except Exception as e:
        log.error(e)
        return {"ok": False, "error": str(e)}
    return {"ok": True, 'result': {'slept_sec': sleep_time}}


@flow_tools.validator(flow_uid='pause')
def pause_validate(**kwargs):
    return PausePayload.validate(kwargs)


@flow_tools.flow(
    uid='test',
    display_name='Test',
    tooltip='Test',
    icon_fa='fa fa-times fa-xl',
    inputs=1,
    weight=1
)
def tst(arg1='DEFAULT', **kwargs):
    log.info(f'Executing tst with {arg1=}')
    log.info(f'Executing tst with {kwargs=}')
    return {
        'ok': True,
        'result': {'text': 'THIS HAS RETURNED!', 'random_number': random.randint(1, 100)}
    }


@flow_tools.validator(flow_uid='test')
def tst_validator(**kwargs) -> Any:
    log.info(f'Executing tst_validator with {kwargs=}')
    return kwargs
