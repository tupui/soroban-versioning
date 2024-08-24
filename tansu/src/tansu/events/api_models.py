import binascii
from typing import Annotated, Literal

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
    try:
        parsed_scval = stellar_sdk.scval.to_native(xdr)
    except ValueError:
        return xdr

    if isinstance(parsed_scval, bytes):
        parsed_scval = binascii.b2a_hex(parsed_scval)
    return parsed_scval


SCValNative_ = Annotated[SCValNative, BeforeValidator(parse_xdr)]


class Event(BaseModel):
    # XDR encoded or decoded to Python types
    action: SCValNative_
    project_key: SCValNative_
    value: SCValNative_
    ledger: int

    model_config = dict(arbitrary_types_allowed=True)


class EventRequest(BaseModel):
    project_key: str
    action: Literal["register", "commit"] | None = "commit"
    limit: int = 1000
