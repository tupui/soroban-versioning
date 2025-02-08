import { expect, test, type Page } from "@playwright/test";
import { githubRepoURL, infoFileHash, wallet2 } from "./constants";
import {
  generateRandomProjectName,
  generateRandomProposalName,
  generateRandomWords,
  sleep,
} from "./utils";
import { setupWallet } from "./wallet-helper";

import { getDemoConfigData } from "../src/constants/demoConfigData";

// test('title is ', async({page}) => {
//   await page.goto("http://localhost:4321/");
//   const locator = page.getByRole("button");
//   await expect(locator).toHaveText("Connect");
// })

const data = getDemoConfigData();

interface CheckResponse {
  success?: boolean;
  error?: string;
}

const checkLabel = async (
  page: Page, 
  tag_id?: string, 
  check_str?: string
): Promise<CheckResponse> => {
  try {
    let locator;
    // check element using getByTestId
    if(check_str){
      if (tag_id){
        locator = page.getByTestId(tag_id);
        await expect(locator).toContainText(check_str);
      }
      else{
        await expect(page.getByText(check_str, { exact: false })).toBeVisible();
      }
    }
    // Check the Test is in the element

    console.log("Check Label Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error 
      ? error.message 
      : "Unknown error" };
  }
};

const checkImage = async (
  page: Page,
  tag_id?: string,  // Optional tag_id
  tag_alt?: string,  // Optional alt text
  check_str?: string, // Optional text check
  display: boolean = true
): Promise<CheckResponse> => {
  try {
    let locator;
    
    // If tag_id is provided, use getByTestId
    if (tag_id) {
      locator = page.getByTestId(tag_id);
    } 
    // If tag_alt is provided, use getByAltText
    else if (tag_alt) {
      locator = page.getByAltText(tag_alt);
    } else {
      throw new Error("Either tag_id or tag_alt must be provided.");
    }

    // If src is invalid
    await expect(locator).not.toHaveAttribute("src", "");

    // If check_str is provided, check text content
    if (check_str) {
      await expect(locator).toHaveAttribute("alt", check_str);
    }

    // Check if the image is visible
    if(!display){
      await expect(locator).not.toBeVisible();
    }
    else{
      await expect(locator).toBeVisible();
    }

    console.log("Check Image Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error 
      ? error.message 
      : "Unknown error" 
    };
  }
};

const checkButton = async (
  page: Page,
  tag_id: string,  // Optional tag_id
  check_str?: string // Optional text check
): Promise<CheckResponse> => {
  try {
    let locator;
    locator = page.getByTestId(tag_id);
    if(check_str){
      await expect(locator).toContainText(check_str);
    }
    await expect(locator).toBeVisible();

    console.log("Check Button Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error 
      ? error.message 
      : "Unknown error" 
    };
  }
};

const checkInput = async (
  page: Page,
  input_id?: string, // CSS selector or getByPlaceholder()
  placehoder?: string,
  input_text?: string,      // Text to type in the input field
  expected_text?: string,  // Expected value after typing (optional)
  shouldBeEnabled: boolean = true, // Default: Input should be enabled
): Promise<CheckResponse> => {
  try {
    let inputField;
    if(input_id){
      inputField = page.getByTestId(input_id);
    }
    else if(placehoder){
      inputField = page.getByPlaceholder(placehoder);
    }
    else{
      throw new Error("Either input_id or placehoder must be provided.");
    }
    // Ensure the input field is visible
    await expect(inputField).toBeVisible();

    // Check if input is enabled/disabled
    if (shouldBeEnabled) {
      await expect(inputField).toBeEnabled();
    } else {
      await expect(inputField).toBeDisabled();
      return { success: true }; // If disabled, no need to type
    }

    // Type into the input field
    if(input_text){
      await inputField.fill(input_text);
    }

    // Check if the expected text matches the input value (if provided)
    if (expected_text) {
      await expect(inputField).toHaveValue(expected_text);
    }

    console.log("Check Input Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

const checkColor = async (
  page: Page,
  tag_id: string,
  color: string,
): Promise<CheckResponse> => {
  try{
    const backgroundDiv = page.getByTestId(tag_id);
    const backgroundDivColor = await backgroundDiv.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(backgroundDivColor).toBe(color);

    console.log("Check Color Success")
    
    return{ success: true }
  }catch(error){
    return { error: error instanceof Error? error.message : "Unknown Error"};
  }
}


test.describe("home page test", () => {
  
  test.beforeAll(async () => {
    console.log("Before tests");
  });

  test.afterAll(async () => {
    console.log("After tests");
  });

  // Check the Url is correct!
  test("correct Url", async ({ page }) => {
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
      results.push(await checkLabel(page, `${item.projectName}-title`, item.projectName)); 
      results.push(await checkLabel(page, `${item.projectName}-description`, item.description));  
      results.push(await checkImage(page, `${item.projectName}-web`));
      results.push(await checkImage(page, `${item.projectName}-github`));
      Object.entries(item.socialLinks).map( async ([platform]) => {
        results.push(await checkImage(page, `${item.projectName}-social-${platform}`));
      })
      item.organizationName
        ? 
          results.push(await checkLabel(page, `${item.projectName}-organization`, item.organizationName)) 
        :
          results.push(await checkLabel(page, `${item.projectName}-nonOrganization`, "No organization name"))   
    })

    // Check Labels exist
    results.push(await checkLabel(page, "navbar-default", "Tansu"));
    results.push(await checkLabel(page, "navbar-default", "Alpha"));   
    results.push(await checkLabel(page, "Featured Projects", "Featured Projects"));  
    results.push(await checkLabel(page, "footer-label", `© ${new Date().getFullYear()} Tansu, Consulting Manao GmbH`));  

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
