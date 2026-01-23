// @ts-nocheck
/**
 * Smart RPC mock – validates request.method + contract function and returns
 * deterministic responses identical to contract unit-test expectations.
 */
import { expect } from "@playwright/test";

interface Expectation {
  func: string;
  result: any; // json-serialisable result the node would wrap in success object
}

const expectations: Record<string, Expectation> = {
  // register returns Bytes (hex string for mock)
  register: {
    func: "register",
    result: "0x012345",
  },
  // create_proposal returns u32 id 1
  create_proposal: {
    func: "create_proposal",
    result: 1,
  },
  update_config: {
    func: "update_config",
    result: true,
  },
  set_badges: { func: "set_badges", result: true },
  commit: { func: "commit", result: true },
  add_member: { func: "add_member", result: true },
  vote: { func: "vote", result: true },
};

export async function rpcMock(route, request) {
  // decode JSON-RPC request
  const body = JSON.parse(request.postData() || "{}");
  const method = body.method;

  // we only handle sendTransaction (result) and simulateTransaction (return empty)
  if (method === "simulateTransaction") {
    route.fulfill({ status: 200, body: JSON.stringify({ results: [] }) });
    return;
  }
  if (method === "sendTransaction") {
    // very naive: extract function name we embedded earlier in kit.signTransaction stub
    const func = body.params?.[0]?.func || "unknown";
    const expectation = expectations[func];
    expect
      .soft(expectation, `Unexpected contract function call ${func}`)
      .toBeTruthy();
    const returnVal = expectation?.result ?? null;

    route.fulfill({
      status: 200,
      body: JSON.stringify({
        status: "SUCCESS",
        hash: "MOCK",
        returnValue: returnVal,
      }),
    });
    return;
  }
  // Any other method: assume simple ok
  route.fulfill({ status: 200, body: JSON.stringify({ status: "SUCCESS" }) });
}
