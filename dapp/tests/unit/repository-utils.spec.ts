import { test, expect } from "@playwright/test";
import {
  parseRepositoryUrl,
  getRepositoryReadmeUrl,
  getRepositoryConfigUrl,
} from "../../src/utils/repository";

// These are pure functions; we can validate parsing and URL building without network

test.describe("repository utils", () => {
  test("parseRepositoryUrl handles GitHub and refs", () => {
    const basic = parseRepositoryUrl("https://github.com/org/repo");
    expect(basic).toBeTruthy();
    expect(basic!.host).toBe("github.com");
    expect(basic!.owner).toBe("org");
    expect(basic!.name).toBe("repo");
    expect(basic!.url).toBe("https://github.com/org/repo");

    const withRef = parseRepositoryUrl("https://github.com/org/repo/tree/dev");
    expect(withRef).toBeTruthy();
    expect(withRef!.ref).toBe("dev");
  });

  test("getRepositoryReadmeUrl builds raw URL for README.md", () => {
    const url = getRepositoryReadmeUrl("https://github.com/org/repo");
    expect(url).toBe(
      "https://raw.githubusercontent.com/org/repo/master/README.md",
    );
  });

  test("getRepositoryConfigUrl builds raw URL for tansu.toml", () => {
    const url = getRepositoryConfigUrl("https://github.com/org/repo");
    expect(url).toBe(
      "https://raw.githubusercontent.com/org/repo/master/tansu.toml",
    );
  });
});
