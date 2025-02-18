import { chromium, type BrowserContext, type Page } from "playwright";
import { wallet1, wallet2, walletExtensionPath } from "./constants";
import type { IWallet } from "./interfaces";
import os from "os";
import path from "path";

// const userDataDir = path.join(os.tmpdir(), "playwright-profile");

const elapse = 100;

// const getPage = (context: BrowserContext, index: number, timeout = 30000) =>
//   new Promise<Page>((resolve, reject) => {
//     let time = 0;
//     const intervalId = setInterval(() => {
//       time += elapse;
//       if (time >= timeout) {
//         clearInterval(intervalId);
//         reject(new Error("Timeout"));
//       }
//       const pages = context.pages();
//       if (!pages[index]) return;
//       clearInterval(intervalId);
//       resolve(pages[index]);
//     }, elapse);
//   });

export const getPage = async (context: BrowserContext, index: number, timeout = 120000): Promise<Page> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const pages = context.pages();
    if (pages[index]) return pages[index];
    await new Promise((r) => setTimeout(r, elapse));
  }
  throw new Error("Timeout: Page did not load in time.");
};

export const connectWalletWithSeeds = async (page: Page, wallet: IWallet) => {
  await page.getByText("Import wallet").click();
  await page.getByTestId("account-creator-password-input").click();
  await page
    .getByTestId("account-creator-password-input")
    .fill(wallet.password);
  await page.getByTestId("account-creator-confirm-password-input").click();
  await page
    .getByTestId("account-creator-confirm-password-input")
    .fill(wallet.password);
  await page.getByText("I have read and agree to").click();
  await page.getByTestId("account-creator-submit").click();
  for (let i = 0; i < wallet.seeds!.length; i++) {
    await page
      .locator(`#MnemonicPhrase-${i + 1}`)
      .fill(wallet.seeds?.[i] || "");
  }
  await page.getByRole("button", { name: "Import" }).click();
  await page.waitForURL(/\/recover-account-success/);
  await page.goBack();
  await page.goBack();
  await page.getByTestId("network-selector-open").click();
  await page.getByText("Test Net").click();
  await page.close();
};

const connectWalletWithSecretKey = async (page: Page, wallet: IWallet) => {
  await page
    .getByPlaceholder("Your Stellar secret key")
    .fill(wallet.secretKey || "");
  await page.getByPlaceholder("Enter password").fill(wallet.password);
  await page.getByText("I’m aware Freighter can’t").click();
  await page.getByRole("button", { name: "Import" }).click();
  await page.close();
};

export async function setupWallet() {
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${walletExtensionPath}`,
      `--load-extension=${walletExtensionPath}`,
    ],
  });

  const pages = context.pages();

  const wallet1Page = await getPage(context, 1);
  if (wallet1Page) {
    await connectWalletWithSeeds(wallet1Page, wallet1);
  }

  // const wallet2Page = await context.newPage();
  // if (wallet2Page) {
  //   await wallet2Page.goto(
  //     "chrome-extension://hghfkofghagaopgofigcbknjpeiaghdc/index.html#/account/import",
  //   );
  //   await connectWalletWithSecretKey(wallet2Page, wallet2);
  // }

  const page = pages[0];

  if (page) {
    await page.goto("http://localhost:4321/");
    await page.getByTestId("connect-wallet-button").click();
    await page.getByText("Freighter").click();
    const walletPage = await getPage(context, 1);
    await walletPage.getByRole("button", { name: "Connect" }).click();
  }

  return {
    context,
    page,
    changeWallet: async (index: number) => {
      const walletPage = await context.newPage();
      await walletPage.goto(
        "chrome-extension://hghfkofghagaopgofigcbknjpeiaghdc/index.html#/account",
      );
      await walletPage
        .getByTestId("account-list-identicon-button")
        .first()
        .click();
      await walletPage
        .getByTestId("account-list-identicon-button")
        .nth(index)
        .click();
      await walletPage.close();
    },
    sign: async () => {
      const walletPage = await getPage(context, 1);
      await walletPage.getByRole("button", { name: "Sign" }).click();
    },
    reviewAndSign: async () => {
      const walletPage = await getPage(context, 1);
      await walletPage.getByText("Review").click();
      await walletPage.getByText("Approve and continue").click();
      await walletPage.getByText("Sign Transaction").click();
    },
  };
}


// export async function setupWallet() {
//   const context = await chromium.launchPersistentContext(userDataDir, {
//     headless: false,
//     args: [
//       `--disable-extensions-except=${walletExtensionPath}`,
//       `--load-extension=${walletExtensionPath}`,
//     ],
//   });
//   console.log("after chrome is on");
  
//   const page = context.pages()[0];
//   if (page) {
//     await page.goto("http://localhost:4321/");
//     await page.getByTestId("connect-wallet-button").click();
//     await page.getByText("Freighter").click();
//     const walletPage = await getPage(context, 1);
//     await walletPage.getByText("Import wallet").click();
//     await walletPage.getByPlaceholder("New password").fill("assassinWalet@1234%")
//     await walletPage.getByPlaceholder("Confirm password").fill("assassinWalet@1234%")
//     await page.getByRole('checkbox', { name: 'termsOfUse' }).check();
//     await walletPage.getByRole("button", { name: "Connect" }).click();
//   }
//   console.log("tansu website is on");
  
//   const wallet1Page = await getPage(context, 1);
//   await connectWalletWithSeeds(wallet1Page, wallet1);
//   console.log("wallet1Page is on");
  
//   // const wallet2Page = await context.newPage();
//   const extensions = context.backgroundPages();
//   const walletExtension = extensions.find((page) =>
//     page.url().includes("chrome-extension://")
//   );
//   const extensionId = walletExtension?.url().split("/")[2];
  
//   // await wallet2Page.goto(`chrome-extension://${extensionId}/index.html#/account/import`);
//   // await connectWalletWithSecretKey(wallet2Page, wallet2);
//   // console.log("wallet2Page is on");
  
  
//   return {
//     context,
//     page,
//     changeWallet: async (index: number) => {
//       const walletPage = await context.newPage();
//       await walletPage.goto(`chrome-extension://${extensionId}/index.html#/account`);
//       await walletPage.getByTestId("account-list-identicon-button").first().click();
//       await walletPage.getByTestId("account-list-identicon-button").nth(index).click();
//       await walletPage.close();
//     },
//     sign: async () => {
//       const walletPage = await getPage(context, 1);
//       await walletPage.getByRole("button", { name: "Sign" }).click();
//     },
//     reviewAndSign: async () => {
//       const walletPage = await getPage(context, 1);
//       await walletPage.getByText("Review").click();
//       await walletPage.getByText("Approve and continue").click();
//       await walletPage.getByText("Sign Transaction").click();
//     },
//   };
// }

// export async function closeWallet(context: BrowserContext) {
//   await context.close();
// }
