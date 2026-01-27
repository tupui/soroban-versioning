import * as StellarSdk from "@stellar/stellar-sdk";

export interface ContractFunction {
  name: string;
  inputs: ContractFunctionInput[];
  outputs?: ContractFunctionOutput[];
}

export interface ContractFunctionInput {
  name: string;
  type: string;
}

export interface ContractFunctionOutput {
  type: string;
}

/**
 * Get available functions from a contract address using Stellar SDK's Client.from()
 * This leverages the SDK's built-in contract spec extraction from client.spec.entries
 */
export async function getContractFunctions(
  contractAddress: string,
  network: "testnet" | "mainnet" = "testnet",
): Promise<ContractFunction[]> {
  try {
    const serverUrl =
      network === "testnet"
        ? "https://soroban-testnet.stellar.org"
        : "https://soroban.stellar.org";

    // Use SDK's Client.from() - this handles contract interaction and has the spec
    const client = await StellarSdk.contract.Client.from({
      contractId: contractAddress,
      rpcUrl: serverUrl,
      networkPassphrase:
        network === "testnet"
          ? StellarSdk.Networks.TESTNET
          : StellarSdk.Networks.PUBLIC,
    });

    // Extract functions from the real contract specification
    const spec = (client as any).spec;
    if (!spec || !spec.entries) {
      // Fallback to basic method names if spec is not available
      return getMethodNamesFromClient(client);
    }

    const functions: ContractFunction[] = [];

    // Filter for function entries in the contract spec
    const functionEntries = spec.entries.filter((entry: any) => {
      return (
        entry.switch &&
        entry.switch() ===
          StellarSdk.xdr.ScSpecEntryKind.scSpecEntryFunctionV0()
      );
    });

    // Parse each function specification
    for (const entry of functionEntries) {
      try {
        const funcSpec = entry.functionV0();
        const funcName = funcSpec.name().toString();

        // Skip constructor
        if (funcName === "__constructor") {
          continue;
        }

        // Extract inputs with real names and types
        const inputs: ContractFunctionInput[] = [];
        const funcInputs = funcSpec.inputs();
        for (const input of funcInputs) {
          inputs.push({
            name: input.name().toString(),
            type: getScSpecTypeName(input.type()),
          });
        }

        // Extract outputs
        const outputs: ContractFunctionOutput[] = [];
        const funcOutputs = funcSpec.outputs();
        for (const output of funcOutputs) {
          outputs.push({
            type: getScSpecTypeName(output),
          });
        }

        functions.push({
          name: funcName,
          inputs,
          outputs,
        });
      } catch {
        // Skip malformed function entries
        continue;
      }
    }

    return functions;
  } catch {
    // Return empty array when introspection fails - user will need manual input
    return [];
  }
}

/**
 * Fallback: Extract basic function names when spec is not available
 */
function getMethodNamesFromClient(client: any): ContractFunction[] {
  const functions: ContractFunction[] = [];
  const methodNames = Object.getOwnPropertyNames(client);

  for (const methodName of methodNames) {
    // Skip non-method properties and internal methods
    if (
      methodName === "constructor" ||
      methodName.startsWith("_") ||
      methodName === "options" ||
      methodName === "fromJSON" ||
      typeof client[methodName] !== "function"
    ) {
      continue;
    }

    functions.push({
      name: methodName,
      inputs: [], // No parameter info available
      outputs: [],
    });
  }

  return functions;
}

/**
 * Convert ScSpecType to readable type name
 */
function getScSpecTypeName(specType: any): string {
  try {
    const typeSwitch = specType.switch();

    switch (typeSwitch) {
      case StellarSdk.xdr.ScSpecType.scSpecTypeU64():
        return "u64";
      case StellarSdk.xdr.ScSpecType.scSpecTypeI64():
        return "i64";
      case StellarSdk.xdr.ScSpecType.scSpecTypeU32():
        return "u32";
      case StellarSdk.xdr.ScSpecType.scSpecTypeI32():
        return "i32";
      case StellarSdk.xdr.ScSpecType.scSpecTypeU128():
        return "u128";
      case StellarSdk.xdr.ScSpecType.scSpecTypeI128():
        return "i128";
      case StellarSdk.xdr.ScSpecType.scSpecTypeU256():
        return "u256";
      case StellarSdk.xdr.ScSpecType.scSpecTypeI256():
        return "i256";
      case StellarSdk.xdr.ScSpecType.scSpecTypeBool():
        return "bool";
      case StellarSdk.xdr.ScSpecType.scSpecTypeSymbol():
        return "symbol";
      case StellarSdk.xdr.ScSpecType.scSpecTypeString():
        return "string";
      case StellarSdk.xdr.ScSpecType.scSpecTypeAddress():
        return "address";
      case StellarSdk.xdr.ScSpecType.scSpecTypeBytes():
        return "bytes";
      case StellarSdk.xdr.ScSpecType.scSpecTypeVec():
        return "vec";
      case StellarSdk.xdr.ScSpecType.scSpecTypeMap():
        return "map";
      default:
        return "unknown";
    }
  } catch {
    return "unknown";
  }
}

/**
 * Validate if a contract address is valid
 */
export function isValidContractAddress(address: string): boolean {
  try {
    new StellarSdk.Address(address);
    return address.startsWith("C") && address.length === 56;
  } catch {
    return false;
  }
}
