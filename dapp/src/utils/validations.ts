/**
 * Validation utility for form inputs and data
 * Centralizes validation logic to avoid duplication
 */

/**
 * Validate a project name
 * @param name The project name to validate
 * @returns An error message if invalid, or null if valid
 */
export function validateProjectName(name: string): string | null {
  if (!name || name.trim() === "") {
    return "Project name is required";
  }

  if (name.length < 4 || name.length > 15) {
    return "Project name must be between 4 and 15 characters";
  }

  if (!/^[a-z]+$/.test(name)) {
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
  if (!url || url.trim() === "") {
    return "GitHub URL is required";
  }

  const validGithubUrl = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
  if (!validGithubUrl.test(url)) {
    return "Invalid GitHub repository URL. Format should be: https://github.com/owner/repo";
  }

  return null;
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
  if (!maintainers || maintainers.trim() === "") {
    return "Maintainers cannot be empty";
  }

  // Basic validation - could be extended with more specific Stellar address validation
  const addresses = maintainers.split(",").map((addr) => addr.trim());

  if (addresses.some((addr) => addr === "")) {
    return "Invalid maintainer address format";
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
