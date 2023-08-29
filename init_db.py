from tools import db


def init_db():
    from .models.workflow import Workflow
    db.get_shared_metadata().create_all(bind=db.engine)
