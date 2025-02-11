import { testCaseProjectNameAfterRegister } from './registerProject.spec';

import { expect, test } from "@playwright/test";
import { chromium, type BrowserContext, type Page } from "playwright";
import { walletExtensionPath } from "../constants";
import { getPage, connectWalletWithSeeds } from "../wallet-helper";

import {
    generateRandomProposalName,
    generateRandomWords,
    sleep,
  } from "../utils";

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

    test('Check Proposal Feature!', async () => {
        if(page){
            await page.goto(`http"//localhost:4321/proposal/new?name=${testCaseProjectNameAfterRegister}`);
            const proposalName = generateRandomProposalName();
            const proposalDescription = generateRandomWords(12);
            await page.getByTestId("proposal-name").fill(proposalName);
            await page.getByLabel("editable markdown").fill(proposalDescription);
            await page
                .getByTestId("proposal-approved-description")
                .fill(generateRandomWords(3));
            await page
                .getByTestId("proposal-approved-xdr")
                .fill(generateRandomWords(3));
            await page
                .getByTestId("rejected-approved-description")
                .fill(generateRandomWords(3));
            await page
                .getByTestId("rejected-approved-xdr")
                .fill(generateRandomWords(3));
            await page
                .getByTestId("cancelled-approved-description")
                .fill(generateRandomWords(3));
            await page
                .getByTestId("cancelled-approved-xdr")
                .fill(generateRandomWords(3));
            await sleep(1000);
            await page.getByTestId("submit-proposal-button").click();
            const signWalletPage = await getPage(context, 1);
            await signWalletPage.getByRole("button", { name: "Sign" }).click();
            await signWalletPage.close();
            const walletExtensionPage = await getPage(context, 1);
            await walletExtensionPage.getByText("Review").click();
            await walletExtensionPage.getByText("Approve and continue").click();
            await walletExtensionPage.getByText("Sign Transaction").click();
        }
    })
})