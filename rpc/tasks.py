<<<<<<< HEAD
from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
from tools import rpc_tools, tasklib  # pylint: disable=E0401
import requests
from ..utils.evaluate import get_evaluater, EvaluateTemplate, TransformationError
from time import sleep

from pydantic import ValidationError
from ..models.pd.flow import Variable


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


    @web.rpc("flowy_evaluate", "eveluate")
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


=======
# from pylon.core.tools import web, log  # pylint: disable=E0611,E0401
# from tools import rpc_tools, tasklib  # pylint: disable=E0401
# import requests
# from jsonpath_ng import parse
#
#
#
class RPC:
    ...
#     @web.rpc("flowy_make_request", "make_request")
#     @rpc_tools.wrap_exceptions(RuntimeError)
#     @tasklib.task("flowy_make_request", {
#         "method": {"tag":"select", "nested_params":False, "choices":{
#                 "post":"Post",
#                 "get":"Get",
#                 "put":"Put",
#                 'patch': 'Patch',
#                 'delete': "Delete",
#             }
#         },
#         "jwt_token":tasklib.STRING_INPUT,
#         "url": tasklib.STRING_INPUT
#     })
#     def _make_request(self, method: str, jwt_token: str, url: str):
#         headers = {}
#         if jwt_token:
#             headers['Authorization'] = f'Bearer {jwt_token}'
#             headers['Content-Type'] = 'application/json'
#         method = getattr(requests, method)
#         response = method(url, headers=headers)
#         if not response.status_code == 200:
#             return {'ok': False, 'error': response.json()}
#         return {"ok": True, 'result': response.json()}
#
#
#     @web.rpc("flowy_evaluate", "eveluate")
#     @rpc_tools.wrap_exceptions(RuntimeError)
#     @tasklib.task("flowy_evaluate", {
#         "query":tasklib.TEXTAREA_INPUT,
#         "payload":tasklib.TEXTAREA_INPUT,
#     })
#     def _make_request(self, project_id: int, query: str, payload: dict):
#         try:
#             # Extracting
#             jsonpath_expr = parse(query)
#             similar_values = [match.value for match in jsonpath_expr.find(payload)]
#
#             # Transformation part
#             result = "\n".join(similar_values)
#         except Exception as e:
#             log.error(e)
#             return {"ok": True, "error": str(e)}
#         return {"ok": True, 'result': result}
#
#
#
>>>>>>> 7ae5d10 (flows + start node)
