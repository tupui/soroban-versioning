import { describe, it, expect } from "vitest";
import {
  extractContractError,
  handleError,
  handleFreighterError,
} from "./errorHandler";

describe("extractContractError", () => {
  it("returns code -4 and message when error.code === -4", () => {
    const out = extractContractError({ code: -4, message: "User denied" });
    expect(out.errorCode).toBe(-4);
    expect(out.errorMessage).toBe("User denied");
  });

  it("uses parseContractError for contract error message", () => {
    const out = extractContractError({
      message: "Error(Contract, #403)",
    });
    expect(out.errorCode).toBe(403);
    expect(out.errorMessage).toBe(
      "There was an error executing outcome contracts.",
    );
  });
});

describe("handleError", () => {
  it("returns parsed message for contract errors", () => {
    const msg = handleError({ message: "Error(Contract, #600)" }, "Test");
    expect(msg).toBe("Contract is paused.");
  });

  it("returns error.message for Error instance", () => {
    const msg = handleError(new Error("Custom error"), "Test");
    expect(msg).toBe("Custom error");
  });

  it("rethrows when rethrow option is true", () => {
    expect(() =>
      handleError(new Error("Fail"), "Test", { rethrow: true }),
    ).toThrow("Fail");
  });
});

describe("handleFreighterError", () => {
  it("returns wallet hint for Freighter in message", () => {
    const msg = handleFreighterError(
      new Error("Freighter not installed"),
      "Submit",
    );
    expect(msg).toContain("Wallet error");
    expect(msg).toContain("Freighter");
  });

  it("returns contract message for contract errors", () => {
    const msg = handleFreighterError(
      { message: "Error(Contract, #401)" },
      "Test",
    );
    expect(msg).toBe("The proposal is still in voting, so cannot be executed.");
  });
});
