from traceback import format_exc
from typing import List, Dict
from abc import ABCMeta, abstractmethod
from jinja2 import Environment
from pylon.core.tools import log


class TransformationError(Exception):
    "Raised when transformation fails"


class MyABC(ABCMeta):
    meta_registry = {}
    def __new__(cls, name, bases, attrs):
        resulting_class = super().__new__(cls, name, bases, attrs)
        if bases: # exlcuding parent class
            name = name.split('TransformerEvaluate')[0].lower()
            cls.meta_registry[name] = resulting_class
            resulting_class._output_format = name
        return resulting_class
    

class EvaluateTemplate(metaclass=MyABC):
    def __init__(self, module, query: str, payload: dict, output_format: str):
        self.context = module.context
        self.query = query
        self.payload = payload
        self.output_format = output_format

    def extract(self):
        try:
            environment = Environment()
            template = environment.from_string(self.query)
            result = template.render(payload=self.payload)
        except:
            log.critical(format_exc())
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

    # template method
    def evaluate(self):
        # extracting
        value: List[Dict] = self.extract()
        self.context.sio.emit("evaluation_extracted_value", value)
        # transforming result
        result = self.handle_transform(value)
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


# Evaluate Factory:
def get_evaluater(format):
    return MyABC.meta_registry.get(format, NoTransformerEvaluate)
