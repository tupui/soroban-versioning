import { expect, test } from "@playwright/test";
import { chromium, type BrowserContext, type Page } from "playwright";
import { wallet1, walletExtensionPath } from "../constants";
import { getPage, connectWalletWithSeeds } from "../wallet-helper";
import { sleep } from "../utils";

import { registeredProjectNames } from "./projectName";

test.describe('Project Feature Test', () => {
    let context: BrowserContext;
    let page: Page;
    const index : number = registeredProjectNames.length;
    const registeredProjectName = registeredProjectNames[index - 1];
    let formattedName = "";
    if(registeredProjectName){
        formattedName = registeredProjectName?.charAt(0).toUpperCase() + registeredProjectName?.slice(1).toLowerCase();
    }

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
    })

    test('Check the git commit in Chain Feature!', async () => {
        if(registeredProjectName){
            await page.goto(`/project?name=${registeredProjectName}`);
            await expect(page.locator("#project-name-value")).toHaveText(registeredProjectName);

            await page.locator("#wrap-commit-button").click();
            const WalletSignPage = await getPage(context, 1);
            await WalletSignPage.getByText("Review").click();
            await WalletSignPage.getByText("Approve and continue").click();
            await WalletSignPage.getByText("Sign Transaction").click();
            await sleep(3000);
            await expect(page.locator("#wrap-commit-button")).toHaveText("Hash committed!");
        }
    })

    test('Check correct navigation to Governance!', async () => {
        if(registeredProjectName){
            await page.goto(`/project?name=${registeredProjectName}`);
            await expect(page.locator("#project-name-value")).toHaveText(registeredProjectName);

            await page.getByRole("button", { name : "Governance" }).click();
            await page.waitForURL(/\/governance\?name=/);
            await page.goto(`/governance?name=${registeredProjectName}`);
            await expect(page.locator("#proposal-page-topic")).toHaveText(`${formattedName} Governance`);
        }
    })
})