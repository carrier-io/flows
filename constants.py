try:
    from enum import StrEnum
except ImportError:
    from enum import Enum


    class StrEnum(str, Enum):
        pass


class SioEvent(StrEnum):
    flow_started = 'flows_flow_started'
    node_finished = 'flows_node_finished'
    flow_finished = 'flows_flow_finished'
    evaluation_extracted = 'flows_evaluation_extracted'
    evaluation_transformed = 'flows_evaluation_transformed'


class OnErrorActions(StrEnum):
    stop = 'stop'
    ignore = 'ignore'
