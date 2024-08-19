import binascii
from typing import Annotated

from pydantic import BaseModel, BeforeValidator
import stellar_sdk
import stellar_sdk.xdr

type SCValNative = (
    bool
    | None
    | int
    | str
    | bytes
    | stellar_sdk.Address
    | stellar_sdk.xdr.SCVal
    | list
    | dict
)


def parse_xdr(
    xdr: str,
) -> SCValNative:
    parsed_scval = stellar_sdk.scval.to_native(xdr)

    if isinstance(parsed_scval, bytes):
        parsed_scval = binascii.b2a_hex(parsed_scval)
    return parsed_scval


SCValNative_ = Annotated[SCValNative, BeforeValidator(parse_xdr)]


class Event(BaseModel):
    # XDR encoded or decoded to Python types
    action: SCValNative_
    project_key: SCValNative_
    value: SCValNative_

    model_config = dict(arbitrary_types_allowed=True)


class EventRequest(BaseModel):
    project_key: str
    action: str
    limit: int = 1000
