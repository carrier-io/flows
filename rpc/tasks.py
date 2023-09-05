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
