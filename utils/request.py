import requests
import json
from pylon.core.tools import log  # pylint: disable=E0611,E0401
from ..models.pd.flow import HTTPRequestType



class RequestManager:    
    def __init__(self, action, headers, url, request_type, output_type, body=None):
        self._action = action
        self._body = body
        self._headers = headers
        self._url = url
        self._request_type = request_type
        self._output_type = output_type
        self._req_params = {
            'headers': self._parse_headers(headers),
        }
        if body:
            if self._request_type == HTTPRequestType.JSON:
                self._req_params['json'] = json.loads(body)
            else:
                self._req_params['data'] = body
    
    def request(self):
        method = getattr(requests, self._action)
        response = method(self._url, **self._req_params)
        content, code  = self._parse_response(response)
        if not code == 200:
            return content, code 
        return self._transform(content), code 
    
    def _parse_response(self, response):
        if self._request_type == HTTPRequestType.JSON:
            return response.json(), response.status_code
        return response.text, response.status_code

    def _transform(self, value):
        transformers = {
            'string': str,
            'integer': int,
            'float': float,
            'json': json.loads
        }
        return transformers[self._output_type](value)

    def _parse_headers(self, headers):
        return {header['name']: header['value'] for header in headers}