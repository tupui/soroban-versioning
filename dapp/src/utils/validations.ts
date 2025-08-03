/**
 * Validation utility for form inputs and data
 * Uses Zod schemas for type-safe validation
 */

import DOMPurify from "dompurify";

// Export validation functions from centralized schemas
export {
  validateProjectName,
  validateStellarAddress,
  validateGithubUrl,
  validateMaintainerAddress,
  validateUrl,
  validateProposalName,
  validateTextContent,
} from "../schemas/validation";

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
