from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
from tools import rpc_tools, tasklib  # pylint: disable=E0401
import requests
from ..utils.evaluate import get_evaluater, EvaluateTemplate
from time import sleep

from pydantic import ValidationError
from ..models.pd.flow import Variable, EvaluatePayload, StartPayload, PausePayload
import re


def handle_exceptions(fn):

    def _is_special_value(value):

        if not isinstance(value, str):
            return False
        
        variable_pattern = r"([a-zA-Z0-9_]+)"
        variables_pattern = r"{{variables\." + variable_pattern + r"}}"
        prev_pattern = r"{{nodes\['"+ variable_pattern + r"'\]\.?" + variable_pattern + r"?}}"

        if re.fullmatch(variables_pattern, value) or \
            re.fullmatch(prev_pattern, value):
            return True

        return False

    def decorated(self, payload):
        try:
            fn(self, payload)
            return {"ok": True}
        except ValidationError as e:
            valid_erros = []
            for error in e.errors():
                log.info(f"ERROR: {error}")
                if error['type'] == "value_error.missing" or "__root__" in error['loc']:
                    valid_erros.append(error)
                    continue
                
                invalid_value = {**payload}
                for loc in error["loc"]:
                    invalid_value = invalid_value[loc]
                
                # check for special values
                if not _is_special_value(invalid_value):
                    valid_erros.append(error)

            if valid_erros:
                return {"ok": False, "errors": valid_erros}
            return {"ok": True}
        except Exception as e:
            # log.error(e)
            return {"ok": False, "error": str(e)}
        
    return decorated


class RPC:
    @web.rpc("flowy_make_request", "make_request")
    @rpc_tools.wrap_exceptions(RuntimeError)
    @tasklib.task("flowy_make_request", {
        "method": {"tag":"select", "nested_params":False, "choices":{
                "post":"Post", 
                "get":"Get", 
                "put":"Put",
                'patch': 'Patch',
                'delete': "Delete",
            }
        },
        "jwt_token":tasklib.STRING_INPUT,
        "url": tasklib.STRING_INPUT
    })
    def _make_request(self, method: str, jwt_token: str, url: str):
        headers = {}
        if jwt_token:
            headers['Authorization'] = f'Bearer {jwt_token}'
            headers['Content-Type'] = 'application/json'
        method = getattr(requests, method)
        response = method(url, headers=headers)
        if not response.status_code == 200:
            return {'ok': False, 'error': response.json()}
        return {"ok": True, 'result': response.json()}


    @web.rpc("flowy_evaluate", "evaluate")
    @rpc_tools.wrap_exceptions(RuntimeError)
    @tasklib.task("flowy_evaluate", {
        "query":tasklib.TEXTAREA_INPUT,
        "payload":tasklib.TEXTAREA_INPUT,
    })
    def _make_evaluate(self, project_id: int, query: str, payload: dict, output_format: str = 'string'):
        try:
            evaluate_class = get_evaluater(output_format)
            evaluater: EvaluateTemplate = evaluate_class(self, query, payload, output_format)
            result = evaluater.evaluate()
        except Exception as e:
            log.error(e)
            return {"ok": False, "error": str(e)}
        return {"ok": True, 'result': result}


    @web.rpc("flowy_evaluate__validate", "evaluate__validate")
    @tasklib.task("flowy_evaluate__validate", {})
    @handle_exceptions
    def _validate_evaluate(self, payload):
        return EvaluatePayload.validate(payload)

    @web.rpc("flowy_pause", "pause")
    @rpc_tools.wrap_exceptions(RuntimeError)
    @tasklib.task("flowy_pause", {})
    def _make_pause(self, project_id: int, time: int):
        try:
            time = float(time)
            sleep(time)
        except Exception as e:
            log.error(e)
            return {"ok": False, "error": str(e)}
        return {"ok": True, 'result': {}}
    

    @web.rpc("flowy_pause__validate", "pause__validate")
    @tasklib.task("flowy_pause__validate", {})
    @handle_exceptions
    def _validate_pause(self, payload):
        return PausePayload.validate(payload)


    @web.rpc("flowy_start_flow", "start_flow")
    @rpc_tools.wrap_exceptions(RuntimeError)
    @tasklib.task("start_flow", {})
    def _start_flow(self, project_id: int, variables: list):
        variable_dict = {}
        for variable in variables:
            try:
                # Use Pydantic to validate and convert the variable
                variable = Variable(**variable)
                variable_dict[variable.name] = variable.value
            except ValidationError as e:
                return {"ok": False, "error": f"Error: {e}", "errors": e.errors()}
        return {"ok": True, 'result': variable_dict}


    @web.rpc("flowy_start_flow__validate", "start_flow__validate")
    @tasklib.task("flowy_start_flow__validate", {})
    @handle_exceptions
    def _validate_start_flow(self, payload):
        return StartPayload.validate(payload)


