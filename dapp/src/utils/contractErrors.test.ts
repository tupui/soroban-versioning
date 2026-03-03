import { describe, it, expect } from "vitest";
import { parseContractError, checkSimulationError } from "./contractErrors";

describe("parseContractError", () => {
  it("returns user message for Error(Contract, #N) format", () => {
    const msg = parseContractError({
      message: "Error(Contract, #100)",
    });
    expect(msg).toBe("The user is not a maintainer.");
  });

  it("returns user message for HostError: Error(Contract, #N) format", () => {
    const msg = parseContractError({
      message: "HostError: Error(Contract, #400)",
    });
    expect(msg).toBe("You have already voted.");
  });

  it("returns contract error #N when code not in map", () => {
    const msg = parseContractError({
      message: "Error(Contract, #999)",
    });
    expect(msg).toBe("Contract error #999");
  });

  it("returns VM hint for WasmVm with build_commitments_from_votes", () => {
    const msg = parseContractError({
      message:
        "HostError: Error(WasmVm, ...) topics:[fn_call,x,build_commitments_from_votes]",
    });
    expect(msg).toContain("Invalid input for contract execution");
    expect(msg).toContain("anonymous voting");
  });

  it("returns raw message for unknown format", () => {
    const msg = parseContractError({ message: "Network timeout" });
    expect(msg).toBe("Network timeout");
  });
});

describe("checkSimulationError", () => {
  it("throws with parsed message when result.simulation.error is set", () => {
    expect(() =>
      checkSimulationError({
        simulation: { error: "Error(Contract, #301)" },
      }),
    ).toThrow("Proposal or page could not be found.");
  });

  it("throws when result.error is set", () => {
    expect(() =>
      checkSimulationError({ error: "Error(Contract, #200)" }),
    ).toThrow("The provided key is invalid.");
  });

  it("does not throw when no error", () => {
    expect(() => checkSimulationError({ simulation: {} })).not.toThrow();
  });
});
