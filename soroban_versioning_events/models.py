import binascii

from pydantic import BaseModel
import stellar_sdk
import stellar_sdk.xdr


class Event(BaseModel):
    # XDR encoded or decoded to Python types
    topics: list[
        bool | None | int | str | bytes | stellar_sdk.Address | stellar_sdk.xdr.SCVal | list | dict]
    value: bool | None | int | str | bytes | stellar_sdk.Address | stellar_sdk.xdr.SCVal | list | dict

    model_config = dict(arbitrary_types_allowed=True)

    @staticmethod
    def parse_xdr(
        xdr: str
    ) -> bool | None | int | str | bytes | stellar_sdk.Address | stellar_sdk.xdr.SCVal | list | dict:
        parsed_scval = stellar_sdk.scval.to_native(xdr)

        if isinstance(parsed_scval, bytes):
            parsed_scval = binascii.b2a_hex(parsed_scval)
        return parsed_scval

    def decompress(self):
        return Event(
            topics=[Event.parse_xdr(xdr) for xdr in self.topics],
            value=Event.parse_xdr(self.value)
        )

# Event = namedtuple("Event", ["topics", "value"])
