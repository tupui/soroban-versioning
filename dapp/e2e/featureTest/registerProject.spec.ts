import { expect, test } from "@playwright/test";
import { chromium, type BrowserContext, type Page } from "playwright";
import { githubRepoURL, infoFileHash, wallet1, walletExtensionPath } from "../constants";
import { getPage, connectWalletWithSeeds } from "../wallet-helper";
import {
    generateRandomProjectName,
} from "../utils";

import { getDemoConfigData } from "../../src/constants/demoConfigData";

export let testCaseProjectNameAfterRegister : string = "";

test.describe('Wallet Connection Test', () => {
    let context: BrowserContext;
    let page: Page;
  
    test.beforeAll(async () => {
        context = await chromium.launchPersistentContext("", {
            headless: false,
            args: [
            `--disable-extensions-except=${walletExtensionPath}`,
            `--load-extension=${walletExtensionPath}`,
            ],
        });
        const pages = context.pages();
        page = pages[0] || await context.newPage();
    });

    test('Check Project Already Exists!', async () => {
        const data = getDemoConfigData();
        const projectNames : string[] = [];
        data.map((item) => {
            projectNames.push(item.projectName);
        })
        if (page) {
            const WalletPage = await getPage(context, 1);
            await connectWalletWithSeeds(WalletPage, wallet1);
            await page.goto("http://localhost:4321/");
            await expect(page).toHaveURL("http://localhost:4321/");
            await expect(page.getByTestId("connect-wallet-button")).toHaveText("Connect");
            await page.getByTestId("connect-wallet-button").click();
            await page.getByText("Freighter").click();
            const walletPage1 = await getPage(context, 1);
            await walletPage1.getByRole("button", { name: "Connect" }).click();
            await walletPage1.close();
            await expect(page.getByTestId('connect-wallet-button')).toHaveText("GAYW7...OAEFV");
            
            const projectName = generateRandomProjectName();
            await page.getByTestId("project-search").fill(projectName);
            for (const name of projectNames) {
                await expect(page.getByTestId("register-new-project-button")).not.toHaveText(name);
            }
        }
    });

    test('Check Register Feature!', async () => {
        if (page) {
            const WalletPage = await getPage(context, 1);
            await connectWalletWithSeeds(WalletPage, wallet1);
            await page.goto("http://localhost:4321/");
            await expect(page).toHaveURL("http://localhost:4321/");
            await expect(page.getByTestId("connect-wallet-button")).toHaveText("Connect");
            await page.getByTestId("connect-wallet-button").click();
            await page.getByText("Freighter").click();
            const walletPage1 = await getPage(context, 1);
            await walletPage1.getByRole("button", { name: "Connect" }).click();
            await walletPage1.close();
            await expect(page.getByTestId('connect-wallet-button')).toHaveText("GAYW7...OAEFV");
            
            const projectName = generateRandomProjectName();
            await page.getByTestId("project-search").fill(projectName);
            await page.getByTestId("project-search").press("Enter");
            await page.getByTestId("register-new-project-button").click();
            await page.goto("/register");
            await page.getByTestId("maintainers").fill(wallet1.address);
            await page.getByTestId("config_url").fill(githubRepoURL);
            await page.getByTestId("config_hash").fill(infoFileHash);
            await page.getByTestId("register-project-button").click();
            const walletPage = await getPage(context, 1);
            await walletPage.getByText("Review").click();
            await walletPage.getByText("Approve and continue").click();
            await walletPage.getByText("Sign Transaction").click();
            await page.waitForURL(/\/project\?name=/);
            const projectNameElement = page.locator("#project-name-value");
            await expect(projectNameElement).toHaveText(projectName);
            testCaseProjectNameAfterRegister = projectName;
        }
    })
    
    test.afterAll(async () => {
        await context.close();
    });    
})