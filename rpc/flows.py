from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
from tools import rpc_tools, flow_tools
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

    def decorated(self, **kwargs):
        try:
            fn(self, **kwargs)
            return {"ok": True}
        except ValidationError as e:
            valid_erros = []
            for error in e.errors():
                log.info(f"ERROR: {error}")
                if error['type'] == "value_error.missing" or "__root__" in error['loc']:
                    valid_erros.append(error)
                    continue
                
                invalid_value = {**kwargs}
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
    # @web.rpc("flowy_make_request", "make_request")
    # @rpc_tools.wrap_exceptions(RuntimeError)
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


    # @web.rpc("flowy_evaluate", "evaluate")
    # @rpc_tools.wrap_exceptions(RuntimeError)
    # @tasklib.task("flowy_evaluate", {
    #     "uid": "evaluate",
    #     "icon_url": "/flows/static/icons/evaluate.svg",
    #     "tooltip": "evaluate.svg",
    # })
    @flow_tools.register(
        uid='evaluate',
        display_name='Evaluate',
        tooltip='Evaluate',
        icon_url='/flows/static/icons/evaluate.svg',
        # validation_rpc='embeddings_calculate_similarities_flow_validate'
    )
    def evaluate(self, project_id: int, query: str, payload: dict, output_format: str = 'string'):
        try:
            evaluate_class = get_evaluater(output_format)
            evaluater: EvaluateTemplate = evaluate_class(self, query, payload, output_format)
            result = evaluater.evaluate()
        except Exception as e:
            log.error(e)
            return {"ok": False, "error": str(e)}
        return {"ok": True, 'result': result}


    # @web.rpc("flowy_evaluate__validate", "evaluate__validate")
    # @handle_exceptions
    @flow_tools.validator(for_uid='evaluate')
    def _validate_evaluate(self, **kwargs):
        return EvaluatePayload.validate(kwargs)

    # @web.rpc("flowy_pause", "pause")
    # @rpc_tools.wrap_exceptions(RuntimeError)
    # @tasklib.task("flowy_pause", {
    #     "uid": "stop",
    #     "tooltip": "stop.svg",
    #     "icon_url": "/flows/static/icons/stop.svg",
    # })

    @flow_tools.flow(
        uid='pause',
        display_name='Pause',
        tooltip='Wait',
        icon_url='/flows/static/icons/pause.svg',
        # validation_rpc='embeddings_calculate_similarities_flow_validate'
    )
    def pause(self, project_id: int, time: int):
        try:
            time = float(time)
            sleep(time)
        except Exception as e:
            log.error(e)
            return {"ok": False, "error": str(e)}
        return {"ok": True, 'result': {}}
    

    # @web.rpc("flowy_pause__validate", "pause__validate")
    # @handle_exceptions
    @flow_tools.validator(for_uid='pause')
    def _validate_pause(self, **kwargs):
        return PausePayload.validate(kwargs)


    # @web.rpc("flowy_start_flow", "start_flow")
    # @rpc_tools.wrap_exceptions(RuntimeError)
    # @tasklib.task("flowy_start_flow", {
    #     "uid": "start",
    #     "tooltip":"start block",
    #     "icon_url":"fa fa-terminal fa-xl"
    # })
    @flow_tools.flow(
        uid='start',
        display_name='Start',
        tooltip='Start node',
        icon_fa='fa fa-terminal fa-xl',
        inputs=0,
        # validation_rpc='embeddings_calculate_similarities_flow_validate'
    )
    def start(self, project_id: int, variables: list):
        variable_dict = {}
        for variable in variables:
            try:
                # Use Pydantic to validate and convert the variable
                variable = Variable(**variable)
                variable_dict[variable.name] = variable.value
            except ValidationError as e:
                return {"ok": False, "error": f"Error: {e}", "errors": e.errors()}
        return {"ok": True, 'result': variable_dict}


    # @web.rpc("flowy_start_flow__validate", "start_flow__validate")
    # @handle_exceptions

    @flow_tools.validator(for_uid='start')
    def _validate_start_flow(self, **kwargs):
        return StartPayload.validate(kwargs)


