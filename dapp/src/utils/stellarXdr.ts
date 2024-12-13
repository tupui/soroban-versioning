import init, {
  decode,
  decode_stream,
  encode,
  guess,
} from "@stellar/stellar-xdr-json";
import wasmUrl from "@stellar/stellar-xdr-json/stellar_xdr_json_bg.wasm?url";

// A wrapper for the Stellar XDR JSON
declare global {
  interface Window {
    __STELLAR_XDR_INIT__?: boolean;
  }
}

const initialize = async () => {
  if (!window.__STELLAR_XDR_INIT__) {
    await init(wasmUrl);
    console.log("Stellar XDR JSON initialized");
    window.__STELLAR_XDR_INIT__ = true;
  }
};

export { initialize, decode, decode_stream, encode, guess };
