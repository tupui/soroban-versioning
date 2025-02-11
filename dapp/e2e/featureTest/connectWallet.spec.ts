import { expect, test } from "@playwright/test";
import { chromium, type BrowserContext, type Page } from "playwright";
import { wallet1, walletExtensionPath } from "../constants";
import { getPage, connectWalletWithSeeds } from "../wallet-helper";

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

    test('Wallet Extension Exists', async () => {
        if (page) {
            await page.goto("http://localhost:4321/");
            await expect(page).toHaveURL("http://localhost:4321/");
            await expect(page.getByTestId("connect-wallet-button")).toHaveText("Connect");
            await page.getByTestId("connect-wallet-button").click();
            await page.getByText("Freighter").click();
            const walletPage = await getPage(context, 1);
            await expect(walletPage).toHaveURL("https://www.freighter.app/");
            await walletPage.close();
        }
    });

    test('Import New Wallet', async () => {
        if(page) {                        
            const WalletPage = await getPage(context, 1);
            await connectWalletWithSeeds(WalletPage, wallet1);
            await page.goto("http://localhost:4321/");
            await expect(page).toHaveURL("http://localhost:4321/");
            await expect(page.getByTestId("connect-wallet-button")).toHaveText("Connect");
            await page.getByTestId("connect-wallet-button").click();
            await page.getByText("Freighter").click();
            const walletPage1 = await getPage(context, 1);
            await walletPage1.getByRole("button", { name: "Connect" }).click();
            await expect(page.getByTestId('connect-wallet-button')).toHaveText("GAYW7...OAEFV");
            await walletPage1.close();
        }
    })
    
    test.afterAll(async () => {
        await context.close();
    });    
})