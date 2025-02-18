import { expect, type Page } from "@playwright/test";

const characters = "abcdefghijklmnopqrstuvwxyz";

export const generateRandomString = (length: number) => {
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }

  return result;
};

export const generateRandomWords = (wordCount: number) =>
  Array.from({ length: wordCount }, () => generateRandomString(4)).join(" ");

export const generateRandomProjectName = () => generateRandomString(15);
export const generateRandomProposalName = () => generateRandomString(12);

export const sleep = (elapse: number) =>
  new Promise((resolve) => setTimeout(resolve, elapse));



export interface CheckResponse {
  success?: boolean;
  error?: string;
}

export const checkString = async (
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

    console.log("🏢✅ Check String Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error 
      ? error.message 
      : "Unknown error" };
  }
};

export const checkLabel = async (
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
        await expect(page.getByLabel(check_str, { exact: false })).toBeVisible();
      }
    }
    // Check the Test is in the element

    console.log("📑✅ Check Label Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error 
      ? error.message 
      : "Unknown error" };
  }
};

export const checkImage = async (
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

    console.log("📷✅ Check Image Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error 
      ? error.message 
      : "Unknown error" 
    };
  }
};

export const checkButton = async (
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

    console.log("🔘✅ Check Button Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error 
      ? error.message 
      : "Unknown error" 
    };
  }
};

export const checkInput = async (
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

    console.log("🙌✅ Check Input Success");

    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};
export const checkColor = async (
  page: Page,
  tag_id: string,
  expectedColor: string,
  tolerance: number = 2 // Allow slight color variations
): Promise<CheckResponse> => {
  try {
    const backgroundDiv = page.getByTestId(tag_id);
    const computedColor = await backgroundDiv.evaluate(el => getComputedStyle(el).backgroundColor);

    // Convert RGB string to an array of numbers
    const extractRGB = (color: string): number[] => {
      const match = color.match(/\d+/g) || [];
      return match.map(Number);
    };

    const expectedRGB = extractRGB(expectedColor);
    const computedRGB = extractRGB(computedColor);

    // Ensure both colors are valid
    if (expectedRGB.length !== 3 || computedRGB.length !== 3) {
      throw new Error(`Invalid color format. Expected: ${expectedColor}, Received: ${computedColor}`);
    }

    // Check if all RGB values are within the tolerance range
    const isWithinTolerance = expectedRGB.every((value, index) => 
      Math.abs(value - (computedRGB[index] ?? 0)) <= tolerance
    );

    if (!isWithinTolerance) {
      throw new Error(`Expected: ${expectedColor}, Received: ${computedColor}`);
    }

    console.log("🎨✅ Check Color Success");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown Error" };
  }
};
