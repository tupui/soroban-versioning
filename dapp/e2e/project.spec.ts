import { test } from "@playwright/test";
import { githubRepoURL, infoFileHash, wallet2 } from "./constants";
import {
  generateRandomProjectName,
  generateRandomProposalName,
  generateRandomWords,
  sleep,
} from "./utils";
import { setupWallet } from "./wallet-helper";

test("Create project", async () => {
  const { page, changeWallet, sign, reviewAndSign } = await setupWallet();

  if (page) {
    // Search for non-existent projects
    const projectName = generateRandomProjectName();
    await page.getByTestId("project-search-input").fill(projectName);
    await page.getByTestId("project-search-input").press("Enter");
    await page.getByTestId("register-new-project-button").click();
    // Register a new project
    await page.goto("/register");
    await page.getByTestId("maintainers").fill(wallet2.address);
    await page.getByTestId("config_url").fill(githubRepoURL);
    await page.getByTestId("config_hash").fill(infoFileHash);
    await page.getByTestId("register-project-button").click();
    reviewAndSign();
    await page.waitForURL(/\/project\?name=/);
    // Submit proposal
    await page.goto(`/proposal/new?name=${projectName}`);
    const proposalName = generateRandomProposalName();
    const proposalDescription = generateRandomWords(12);
    await page.getByTestId("proposal-name").fill(proposalName);
    await page.getByLabel("editable markdown").fill(proposalDescription);
    await page
      .getByTestId("proposal-approved-description")
      .fill(generateRandomWords(3));
    await page.getByTestId("submit-proposal-button").click();
    await sign();
    await sleep(2000);
    await reviewAndSign();
    await page.waitForURL(/\/governance\?name=/);
    // Vote
    await changeWallet(1);
    await page.getByTestId("connect-wallet-button").click();
    await page.getByText("Freighter").click();
    await page.getByText(proposalName).click();
    await page.getByTestId("show-vote-modal-button").click();
    await page.getByTestId("vote-option-approve").check();
    await page.getByTestId("vote-button").click();
    await reviewAndSign();
  }
});

test("Support", async () => {
  const { page, sign } = await setupWallet();
  if (page) {
    await page.goto("/project?name=tansu");
    await page.getByRole("button", { name: "♥ Support" }).click();
    await page.locator("#donate-modal").click();
    await page.getByRole("button", { name: "Contribute to tansu.xlm" }).click();
    await sign();
  }
});
