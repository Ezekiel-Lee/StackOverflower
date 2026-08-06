"""
Cross-database GUID column type.

Postgres gets its native UUID type; SQLite (used by the pytest suite, so
tests don't require a running Postgres instance) gets a CHAR(36) string.
Production always runs on Postgres per the team's tech stack doc — this
only affects how tests execute.
"""
import uuid

from sqlalchemy.types import CHAR, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=False))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return str(value)


def gen_uuid() -> str:
    return str(uuid.uuid4())
