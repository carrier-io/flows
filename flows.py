import random
from typing import Any

from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
from tools import rpc_tools, flow_tools
import requests
from .utils.evaluate import get_evaluator, EvaluateTemplate
from time import sleep

from pydantic import ValidationError
from .models.pd.flow import Variable, EvaluatePayload, StartPayload, PausePayload, EndPayload


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
def start(flow_context: dict, clean_data: dict):
    result = {
        variable['name']: variable['value']
        for variable in clean_data['variables']
    }
    return {"ok": True, 'result': result}


@flow_tools.validator(flow_uid='start')
def start_validate(**kwargs):
    return StartPayload.validate(kwargs)


@flow_tools.flow(
    uid='evaluate',
    display_name='Evaluate',
    tooltip='Evaluate',
    icon_url='/flows/static/icons/evaluate.svg',
    weight=90
)
def evaluate(flow_context: dict, clean_data: dict):
    output_type = clean_data.get('output_type', "string")
    eval_input = clean_data['eval_input']
    try:
        module = flow_context.get("module")
        evaluate_class = get_evaluator(output_type)
        evaluator: EvaluateTemplate = evaluate_class(module, eval_input, output_type)
        result = evaluator.evaluate()
    except Exception as e:
        log.error(e)
        return {"ok": False, "error": str(e)}
    return {"ok": True, 'result': result}


@flow_tools.validator(flow_uid='evaluate')
def evaluate_validate(**kwargs):
    return EvaluatePayload.validate(kwargs)


@flow_tools.flow(
    uid='end',
    display_name='End',
    tooltip='End',
    icon_url='/flows/static/icons/stop.svg',
    outputs=0,
    weight=5,
)
def end(flow_context: dict, clean_data: dict):
    eval_input = clean_data['eval_input']
    try:
        if eval_input:
            return evaluate(flow_context, clean_data)

        config = flow_context.get('task_config')
        parent = config['direct_parents'][0]
        name = flow_context['tasks'][parent]['name']
        value = flow_context['outputs'].get(name)
        return {"ok": True, "result": value}
    except Exception as e:
        log.error(e)
        return {"ok": False, "error": str(e)}


@flow_tools.validator(flow_uid='end')
def end_validate(**kwargs):
    return EndPayload.validate(kwargs)


@flow_tools.flow(
    uid='pause',
    display_name='Pause',
    tooltip='Wait',
    icon_url='/flows/static/icons/pause.svg',
    weight=89
)
def pause(flow_context: dict, clean_data: dict):
    try:
        sleep_time = clean_data['wait_time_ms'] / 1000
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
    weight=7
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
