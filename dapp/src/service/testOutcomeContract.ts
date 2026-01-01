// testOutcomeContract.ts
import * as StellarSdk from "@stellar/stellar-sdk";

interface OutcomeContractInput {
  type: "contract" | "text";
  address?: string;
  execute_fn?: string;
  args?: any[];
  text?: string;
}

function convertToScVal(value: any): StellarSdk.xdr.ScVal {
  if (typeof value === "string") return StellarSdk.xdr.ScVal.scvString(value);
  if (typeof value === "number")
    return StellarSdk.xdr.ScVal.scvU64(BigInt(Math.floor(value)));
  if (typeof value === "boolean") return StellarSdk.xdr.ScVal.scvBool(value);
  if (value && typeof value === "object" && value._isAddress) {
    return StellarSdk.xdr.ScVal.scvAddress(
      new StellarSdk.Address(value.publicKey),
    );
  }
  return StellarSdk.xdr.ScVal.scvBytes(Buffer.from(JSON.stringify(value)));
}

function prepareOutcomeContracts(inputs: OutcomeContractInput[]) {
  return inputs.map((input, idx) => {
    try {
      if (!input) return null;

      if (input.type === "contract") {
        if (!input.address || !input.execute_fn) {
          throw new Error(
            `Contract outcome at index ${idx} missing address or execute_fn`,
          );
        }
        return {
          address: input.address,
          execute_fn: input.execute_fn,
          args: (input.args || []).map(convertToScVal),
        };
      }

      if (input.type === "text") {
        return input.text ? { text: input.text } : null;
      }

      throw new Error(`Unknown outcome type at index ${idx}`);
    } catch (err: any) {
      console.error("Error processing outcome at index", idx, ":", err.message);
      return null;
    }
  });
}

// Custom replacer to stringify BigInt
function stringifyBigInt(key: string, value: any) {
  if (typeof value === "bigint") return value.toString();
  return value;
}

// ----------------- Test data -----------------
const testOutcomes: OutcomeContractInput[] = [
  {
    type: "contract",
    address: "CCKHNE3SOVW3OQRFEES6O2KGZMU2BTS2GT4SMLOWVOOLZ7D6IUTMVEKP",
    execute_fn: "token_uri",
    args: [0],
  },
  {
    type: "text",
    text: "Reject outcome: select text",
  },
  {
    type: "contract", // Deliberate mistake
    address: "ABCDEF123456",
  },
];

// Run the test
console.log("=== Testing OutcomeContract Conversion ===");
const converted = prepareOutcomeContracts(testOutcomes);

// Log safely
console.log(
  "Final converted outcome contracts:\n",
  JSON.stringify(converted, stringifyBigInt, 2),
);
