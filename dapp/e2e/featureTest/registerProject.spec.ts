import { expect, test } from "@playwright/test";
import { chromium, type BrowserContext, type Page } from "playwright";
import { githubRepoURL, infoFileHash, wallet1, walletExtensionPath } from "../constants";
import { getPage, connectWalletWithSeeds } from "../wallet-helper";
import {
    generateRandomProjectName,
    generateRandomString,
} from "../utils";

import { registeredProjectNames } from "./projectName";

test.describe('Register Test', () => {
    let context: BrowserContext;
    let page: Page;
    const projectName = generateRandomProjectName();

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
    });

    test('Check Project Already Exists!', async () => {
        if (page) {
            await page.getByTestId("project-search").fill(projectName);
            for (const name of registeredProjectNames) {
                await expect(page.getByTestId("register-new-project-button")).not.toHaveText(name);
            }
        }
    });

    test('Check Register Feature!', async () => {
        if (page) {
            await page.getByTestId("project-search").fill(projectName);
            await page.getByTestId("project-search").press("Enter");
            await page.getByTestId("register-new-project-button").click();
            await page.goto("/register");
            await page.getByTestId("maintainers").fill(wallet1.address);
            await page.getByTestId("config_url").fill(githubRepoURL);
            await page.getByTestId("config_hash").fill(infoFileHash);
            await page.getByTestId("register-project-button").click();
            await expect(page.locator("#project_name_error")).not.toHaveText("Project name already registered");
            await expect(page.locator("#maintainers_error")).not.toHaveText("Invalid maintainer address(es). Each address should start with 'G' and be 56 characters long.");
            await expect(page.locator("#config_url_error")).not.toHaveText("Invalid GitHub repository URL");
            await expect(page.locator("#config_hash_error")).not.toHaveText("File hash must be 64 characters long");
            const walletPage = await getPage(context, 1);
            await walletPage.getByText("Review").click();
            await walletPage.getByText("Approve and continue").click();
            await walletPage.getByText("Sign Transaction").click();
            await page.waitForURL(/\/project\?name=/);
            const projectNameElement = page.locator("#project-name-value");
            await expect(projectNameElement).toHaveText(projectName);
            registeredProjectNames.push(projectName);
        }
    })

    test('Check the register Validation', async () => {
        //first case
        await page.goto("/register");
        await page.getByTestId("project_name").fill("assassin");
        await page.getByTestId("maintainers").fill(generateRandomString(56));
        await page.getByTestId("config_url").fill("https://github.com/");
        await page.getByTestId("config_hash").fill("");
        await page.getByTestId("register-project-button").click();
        await expect(page.locator("#project_name_error")).toHaveText("Project name already registered");
        await expect(page.locator("#project_name_error")).toBeVisible();
        await expect(page.locator("#maintainers_error")).toHaveText("Invalid maintainer address(es). Each address should start with 'G' and be 56 characters long.");
        await expect(page.locator("#maintainers_error")).toBeVisible();
        await expect(page.locator("#config_url_error")).toHaveText("Invalid GitHub repository URL");
        await expect(page.locator("#config_url_error")).toBeVisible();
        await expect(page.locator("#config_hash_error")).toHaveText("File hash must be 64 characters long");
        await expect(page.locator("#config_hash_error")).toBeVisible();

        // second case
        await page.getByTestId("maintainers").fill("");
        await page.getByTestId("register-project-button").click();
        await expect(page.locator("#maintainers_error")).toHaveText("Maintainers cannot be empty");
        await expect(page.locator("#maintainers_error")).toBeVisible();

        //third case
        await page.getByTestId("project_name").fill("");
        await page.getByTestId("maintainers").fill(wallet1.address);
        await page.getByTestId("config_url").fill(githubRepoURL);
        await page.getByTestId("config_hash").fill(infoFileHash);
        await page.getByTestId("register-project-button").click();
        page.on('dialog', async (dialog) => {
            console.log(dialog.message());
            expect(dialog.message()).toBe('The proposal voting time has expired.');
            await dialog.accept();
        });        
    })
    
    test.afterAll(async () => {
        await context.close();
    });    
})