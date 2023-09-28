import json
from traceback import format_exc
from typing import List, Dict
from abc import ABCMeta, abstractmethod
from jinja2 import Environment, TemplateSyntaxError, UndefinedError
from pylon.core.tools import log

from ..constants import SioEvent


class TransformationError(Exception):
    "Raised when transformation fails"


class MyABC(ABCMeta):
    meta_registry = {}

    def __new__(mcs, name, bases, attrs):
        resulting_class = super().__new__(mcs, name, bases, attrs)
        if bases:  # exlcuding parent class
            name = name.split('TransformerEvaluate')[0].lower()
            mcs.meta_registry[name] = resulting_class
            resulting_class._output_format = name
        return resulting_class


class EvaluateTemplate(metaclass=MyABC):
    def __init__(self, module, flow_context, query: str, output_format: str):
        self.context = module.context
        self.flow_context = flow_context
        self.query = query
        self.output_format = output_format

    def extract(self):
        environment = Environment()

        def json_loads_filter(json_string: str, do_replace: bool = False):
            import json
            if do_replace:
                json_string = json_string.replace("'", "\"")
            return json.loads(json_string)

        environment.filters['json_loads'] = json_loads_filter
        try:
            template = environment.from_string(self.query)
            result = template.render()
        except (TemplateSyntaxError, UndefinedError):
            log.critical(format_exc())
            log.info('Template str: %s', self.query)
            raise Exception("Invalid jinja template in context")
        return result

    def handle_transform(self, value):
        try:
            result = self.transform(value)
        except ValueError:
            log.error(format_exc())
            format = self._output_format
            raise TransformationError(f"Can't convert {value} to {format}")
        return result

    @abstractmethod
    def transform(self, value):
        pass

    def emit_event(self, topic, result):
        payload = {
            "ok": True,
            "result": result,
            "run_id": self.flow_context['run_id'],
            "project_id": self.flow_context['project_id'],
            "flow_id": self.flow_context['flow_id']
        }
        self.context.sio.emit(topic, payload)
        
    # template method
    def evaluate(self):
        # extracting
        value: List[Dict] = self.extract()
        self.emit_event(SioEvent.evaluation_extracted, value)
        # transforming result
        result = self.handle_transform(value)
        self.emit_event(SioEvent.evaluation_transformed, result)
        return result


class StringTransformerEvaluate(EvaluateTemplate):
    def transform(self, value):
        if isinstance(value, list):
            return "\n".join(value)
        return str(value)


class IntegerTransformerEvaluate(EvaluateTemplate):
    def transform(self, value):
        return int(float(value))


class FloatTransformerEvaluate(EvaluateTemplate):
    def transform(self, value):
        return float(value)


class NoTransformerEvaluate(EvaluateTemplate):
    def transform(self, value):
        return value


class JsonTransformerEvaluate(EvaluateTemplate):
    def transform(self, value: str) -> dict:
        return json.loads(value)


# Evaluate Factory:
def get_evaluator(output_type: str):
    return MyABC.meta_registry.get(output_type, NoTransformerEvaluate)
