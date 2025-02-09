import { expect, test } from "@playwright/test";
// import { githubRepoURL, infoFileHash, wallet2 } from "./constants";
// import {
//   generateRandomProjectName,
//   generateRandomProposalName,
//   generateRandomWords,
//   sleep,
// } from "./utils";
// import { setupWallet } from "./wallet-helper";

import{
  checkString,
  checkImage,
  checkButton,
  checkInput,
  checkColor,

} from './utils'

import type { CheckResponse } from './utils';

import { getDemoConfigData } from "../src/constants/demoConfigData";

const data = getDemoConfigData();

test.describe("Home page test", () => {
  
  test.beforeAll(async () => {
    console.log("Home Page Test Begin");
  });

  test.afterAll(async () => {
    console.log("Home Page Test Finished");
  });

  // Check the Url is correct!
  test("Home page Url", async ({ page }) => {
    // ✅ Navigate to the URL first
    await page.goto("http://localhost:4321");
    
    // ✅ Then, check if the URL is correct
    await expect(page).toHaveURL("http://localhost:4321");
    
    console.log("Test passed!");
  });
  
  // Check home UI is correct!
  test("home Ui test", async({page}) => {
    const results : CheckResponse[] = [];

    await page.goto("http://localhost:4321");

    // Check if Images exsit
    results.push(await checkImage(page, undefined, "Logo", "Logo"));
    results.push(await checkImage(page, "serachIcon", "serachIcon", "serachIcon"));
    results.push(await checkImage(page, undefined, "(//)", "(//)"));
    results.push(await checkImage(page, "footer-github"));
    results.push(await checkImage(page, "footer-stellar"));
    results.push(await checkImage(page, "footer-discord"));

    // project-modal ui test
    data.map( async (item) => {
      results.push(await checkImage(page, undefined, item.projectName, item.projectName));
      results.push(await checkString(page, `${item.projectName}-title`, item.projectName)); 
      results.push(await checkString(page, `${item.projectName}-description`, item.description));  
      results.push(await checkImage(page, `${item.projectName}-web`));
      results.push(await checkImage(page, `${item.projectName}-github`));
      Object.entries(item.socialLinks).map( async ([platform]) => {
        results.push(await checkImage(page, `${item.projectName}-social-${platform}`));
      })
      item.organizationName
        ? 
          results.push(await checkString(page, `${item.projectName}-organization`, item.organizationName)) 
        :
          results.push(await checkString(page, `${item.projectName}-nonOrganization`, "No organization name"))   
    })

    // Check Labels exist
    results.push(await checkString(page, "navbar-default", "Tansu"));
    results.push(await checkString(page, "navbar-default", "Alpha"));   
    results.push(await checkString(page, "Featured Projects", "Featured Projects"));  
    results.push(await checkString(page, "footer-label", `© ${new Date().getFullYear()} Tansu, Consulting Manao GmbH`));  

    //Check if the button exists
    results.push(await checkButton(page, "connect-wallet-button", "Connect"))
    //Check if the searchBar exists
    results.push(await checkInput(page, "project-search", "Search or register a project...", "Stellar", "Stellar"));

    // Check the color
    results.push(await checkColor(page, "footer-parent", "rgb(185, 255, 102)"));

    // Ensure all checks passed
    for (const result of results) {
      if (result.error) {
        console.log("error :", result.error);
        throw new Error(`Label check failed: ${result.error}`);
      }
    }
  })
});





// test("Main flow", async () => {
//   const { page, changeWallet, sign, reviewAndSign } = await setupWallet();

//   if (page) {
//     // Search for non-existent projects
//     const projectName = generateRandomProjectName();
//     await page.getByTestId("project-search").fill(projectName);
//     await page.getByTestId("project-search").press("Enter");
//     await page.getByTestId("register-new-project-button").click();
//     // Register a new project
//     await page.goto("/register");
//     await page.getByTestId("maintainers").fill(wallet2.address);
//     await page.getByTestId("config_url").fill(githubRepoURL);
//     await page.getByTestId("config_hash").fill(infoFileHash);
//     await page.getByTestId("register-project-button").click();
//     reviewAndSign();
//     await page.waitForURL(/\/project\?name=/);
//     // Submit proposal
//     await page.goto(`/proposal/new?name=${projectName}`);
//     const proposalName = generateRandomProposalName();
//     const proposalDescription = generateRandomWords(12);
//     await page.getByTestId("proposal-name").fill(proposalName);
//     await page.getByLabel("editable markdown").fill(proposalDescription);
//     await page
//       .getByTestId("proposal-approved-description")
//       .fill(generateRandomWords(3));
//     await sleep(1000);
//     await page.getByTestId("submit-proposal-button").click();
//     await sign();
//     await sleep(2000);
//     await reviewAndSign();
//     await page.waitForURL(/\/governance\?name=/);
//     // Vote
//     await changeWallet(1);
//     await page.getByTestId("connect-wallet-button").click();
//     await page.getByText("Freighter").click();
//     await page.getByText(proposalName).click();
//     await page.getByTestId("show-vote-modal-button").click();
//     await page.getByTestId("vote-option-approve").check();
//     await page.getByTestId("vote-button").click();
//     await reviewAndSign();
//     // Support
//     await page.goto(`/project?name=${projectName}`);
//     await page.getByTestId("show-support-modal-button").click();
//     await page.getByTestId("support-button").click();
//     await sign();
//   }
// });
