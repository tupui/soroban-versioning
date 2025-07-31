/**
 * Validation utility for form inputs and data
 * Centralizes validation logic to avoid duplication
 */

import DOMPurify from "dompurify";

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Basic sanitization - remove script tags and dangerous patterns
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed in form inputs
    ALLOWED_ATTR: [],
  });
}

/**
 * Validate a project name
 * @param name The project name to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateProjectName(name: string): string | null {
  const sanitized = sanitizeInput(name);

  if (!sanitized || sanitized.trim() === "") {
    return "Project name is required";
  }

  if (sanitized.length < 4 || sanitized.length > 15) {
    return "Project name must be between 4 and 15 characters";
  }

  if (!/^[a-z]+$/.test(sanitized)) {
    return "Project name can only contain lowercase letters (a-z)";
  }

  return null;
}

/**
 * Validate a GitHub repository URL
 * @param url The GitHub URL to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateGithubUrl(url: string): string | null {
  const sanitized = sanitizeInput(url);

  if (!sanitized || sanitized.trim() === "") {
    return "GitHub URL is required";
  }

  try {
    const parsedUrl = new URL(sanitized);
    if (parsedUrl.hostname !== "github.com") {
      return "URL must be from github.com";
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    if (pathParts.length !== 2) {
      return "URL must be in format: https://github.com/username/repository";
    }

    return null;
  } catch {
    return "Invalid URL format";
  }
}

/**
 * Validate a file hash
 * @param hash The hash to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateFileHash(hash: string): string | null {
  if (!hash || hash.trim() === "") {
    return "File hash is required";
  }

  if (hash.length !== 64) {
    return "File hash must be 64 characters long";
  }

  if (!/^[a-fA-F0-9]+$/.test(hash)) {
    return "File hash must contain only hexadecimal characters";
  }

  return null;
}

/**
 * Validate a list of maintainers (comma-separated addresses)
 * @param maintainers The maintainers string to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateMaintainers(maintainers: string): string | null {
  const sanitized = sanitizeInput(maintainers);

  if (!sanitized || sanitized.trim() === "") {
    return "Maintainers cannot be empty";
  }

  // Basic validation - could be extended with more specific Stellar address validation
  const addresses = sanitized.split(",").map((addr: string) => addr.trim());

  if (addresses.some((addr: string) => addr === "")) {
    return "Invalid maintainer address format";
  }

  return null;
}

/**
 * Validate a Stellar address
 * @param address The Stellar address to validate
 * @param required Whether the address is required (default: true)
 * @returns An error message if invalid, or null if valid
 */
export function validateStellarAddress(
  address: string,
  required = true,
): string | null {
  if (!address || address.trim() === "") {
    return required ? "Stellar address is required" : null;
  }

  if (!address.startsWith("G") || address.length !== 56) {
    return "Invalid Stellar address format. Must start with 'G' and be 56 characters long";
  }

  return null;
}

/**
 * Validate a single maintainer address
 * @param address The maintainer address to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateMaintainerAddress(address: string): string | null {
  if (!address || address.trim() === "") {
    return "Maintainer address cannot be empty";
  }

  return validateStellarAddress(address);
}

/**
 * Validate a URL (social media, website, etc.)
 * @param url The URL to validate
 * @param required Whether the URL is required (default: false)
 * @returns An error message if invalid, or null if valid
 */
export function validateUrl(url: string, required = false): string | null {
  if (!url || url.trim() === "") {
    return required ? "URL is required" : null;
  }

  if (!url.startsWith("https://")) {
    return "URL must start with https://";
  }

  return null;
}

/**
 * Validate the minimum word count of a text
 * @param text The text to validate
 * @param minWords The minimum number of words required (default: 3)
 * @param fieldName The name of the field for the error message (default: "Text")
 * @returns An error message if invalid, or null if valid
 */
export function validateTextContent(
  text: string,
  minWords = 3,
  fieldName = "Text",
): string | null {
  if (!text || text.trim() === "") {
    return `${fieldName} is required`;
  }

  const words = text.trim().split(/\s+/).length;
  if (words < minWords) {
    return `${fieldName} must contain at least ${minWords} words`;
  }

  return null;
}

/**
 * Validate if text content has sufficient words
 * @param text The text to check
 * @param minWords The minimum number of words required (default: 3)
 * @returns True if the text has at least the minimum number of words
 */
export function isContentValid(text: string, minWords = 3): boolean {
  if (!text || text.trim() === "") {
    return false;
  }

  return text.trim().split(/\s+/).length >= minWords;
}

/**
 * Validate a proposal name
 * @param name The proposal name to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateProposalName(name: string): string | null {
  if (!name || name.trim() === "") {
    return "Proposal name is required";
  }

  if (name.length < 10 || name.length > 256) {
    return "Proposal name must be between 10 and 256 characters";
  }

  return null;
}

/**
 * Validate all project registration inputs
 * @param data The project data to validate
 * @returns An object with validation errors, or empty object if all valid
 */
export function validateProjectRegistration(data: {
  project_name: string;
  maintainers: string;
  config_url: string;
  config_hash: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameError = validateProjectName(data.project_name);
  if (nameError) errors.project_name = nameError;

  const maintainersError = validateMaintainers(data.maintainers);
  if (maintainersError) errors.maintainers = maintainersError;

  const urlError = validateGithubUrl(data.config_url);
  if (urlError) errors.config_url = urlError;

  const hashError = validateFileHash(data.config_hash);
  if (hashError) errors.config_hash = hashError;

  return errors;
}
