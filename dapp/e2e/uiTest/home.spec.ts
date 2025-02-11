import { expect, test } from "@playwright/test";
import { githubRepoURL, infoFileHash, wallet2, wallet1 } from "../constants";
import {
  generateRandomProjectName,
  generateRandomProposalName,
  generateRandomWords,
  sleep,
} from "../utils";
import { setupWallet } from "../wallet-helper";

import{
  checkString,
  checkImage,
  checkButton,
  checkInput,
  checkColor,

} from '../utils'

import type { CheckResponse } from '../utils';
import { loadProjectName } from "@service/StateService";
import { extractConfigData } from "../../src/utils/utils";
import { getDemoConfigData } from "../../src/constants/demoConfigData";

const data = getDemoConfigData();

test.describe("Home page test", () => {
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


test.describe("Home Page Feature test", () => {
  test("Modal Feature Test", async({page}) => {
    // Check Url is correct
    await page.goto("http://localhost:4321/");
    await expect(page).toHaveURL("http://localhost:4321/");

    //Check Modal is Open

    await Promise.all(
      data.map(async (item) => {
        const modalButton = page.getByTestId(`${item.projectName}_modal_open`);
        await expect(modalButton).toBeVisible();
    
        // ✅ Wait for button to be available before interacting
        try {
          await modalButton.waitFor({ timeout: 10000 });
        } catch {
          // console.log(`❌ Modal button not found or not attached for: ${item.projectName}`);
          return;
        }
    
        console.log(`✅ Clicking modal button for: ${item.projectName}`);
        await modalButton.focus();
        await modalButton.click();
    
        // ✅ Wait for modal to be visible before checking localStorage
        const modalTestId = "project-info-modal";
        const modal = page.getByTestId(modalTestId);
        await modal.waitFor({ timeout: 10000 });
        await expect(modal).toBeVisible();

        let configData = null;
        for (let i = 0; i < 10; i++) {  // Retry for up to 10 seconds
          configData = await page.evaluate(() => JSON.parse(localStorage.getItem("configData") || "null"));
          if (configData && configData.projectName) break;
          await page.waitForTimeout(1000);  // Wait 1 second before retrying
        }

        if (!configData || !configData.projectName) {
          throw new Error(`❌ configData not found for ${item.projectName}`);
        }
    
        console.log(`✅ Modal opened for: ${configData.projectName}`);
    
        // ✅ Ensure modal title matches project name
        await expect(modal.getByTestId(`${configData.projectName}-modalTitle`)).toHaveText(configData.projectName);
      })
    );
  })
})





