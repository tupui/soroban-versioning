import { expect, test } from "@playwright/test";
import{
  checkString,
  checkImage,
  checkButton,
  checkInput,
  checkColor,

} from '../utils'

import type { CheckResponse } from '../utils';
import { getDemoConfigData } from "../../src/constants/demoConfigData";

const data = getDemoConfigData();

test.describe("Home page test", () => {
  test("Home page Url", async ({ page }) => {
    await page.goto("http://localhost:4321");
    
    await expect(page).toHaveURL("http://localhost:4321");
    
  });
  
  test("home Ui test", async({page}) => {
    const results : CheckResponse[] = [];

    await page.goto("http://localhost:4321");

    results.push(await checkImage(page, undefined, "Logo", "Logo"));
    results.push(await checkImage(page, "serachIcon", "serachIcon", "serachIcon"));
    results.push(await checkImage(page, undefined, "(//)", "(//)"));
    results.push(await checkImage(page, "footer-github"));
    results.push(await checkImage(page, "footer-stellar"));
    results.push(await checkImage(page, "footer-discord"));

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

    results.push(await checkString(page, "navbar-default", "Tansu"));
    results.push(await checkString(page, "navbar-default", "Alpha"));   
    results.push(await checkString(page, "Featured Projects", "Featured Projects"));  
    results.push(await checkString(page, "footer-label", `© ${new Date().getFullYear()} Tansu, Consulting Manao GmbH`));  

    results.push(await checkButton(page, "connect-wallet-button", "Connect"))
    results.push(await checkInput(page, "project-search", "Search or register a project...", "Stellar", "Stellar"));
    results.push(await checkColor(page, "footer-parent", "rgb(185, 255, 102)"));

    for (const result of results) {
      if (result.error) {
        throw new Error(`Label check failed: ${result.error}`);
      }
    }
  })
});


test.describe("Home Page Feature test", () => {
  test("Modal Feature Test", async({page}) => {
    await page.goto("http://localhost:4321/");
    await expect(page).toHaveURL("http://localhost:4321/");

    await Promise.all(
      data.map(async (item) => {
        const modalButton = page.getByTestId(`${item.projectName}_modal_open`);
        await expect(modalButton).toBeVisible();
    
        try {
          await modalButton.waitFor({ timeout: 10000 });
        } catch {
          return;
        }
    
        await modalButton.focus();
        await modalButton.click();
    
        const modalTestId = "project-info-modal";
        const modal = page.getByTestId(modalTestId);
        await modal.waitFor({ timeout: 10000 });
        await expect(modal).toBeVisible();

        let configData = null;
        for (let i = 0; i < 10; i++) {  
          configData = await page.evaluate(() => JSON.parse(localStorage.getItem("configData") || "null"));
          if (configData && configData.projectName) break;
          await page.waitForTimeout(1000);  
        }

        if (!configData || !configData.projectName) {
          throw new Error(`❌ configData not found for ${item.projectName}`);
        }
    
        await expect(modal.getByTestId(`${configData.projectName}-modalTitle`)).toHaveText(configData.projectName);
      })
    );
  })
})





