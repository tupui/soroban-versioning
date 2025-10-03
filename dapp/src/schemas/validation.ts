import { z } from "zod";

/**
 * Centralized validation schemas using Zod.
 * Type-safe, composable validation for all form inputs and data.
 */

// Base field schemas
export const stellarAddressSchema = z
  .string()
  .min(1, "Stellar address is required")
  .length(56, "Stellar address must be 56 characters long")
  .regex(
    /^G[A-Z0-9]{55}$/,
    "Invalid Stellar address format. Must start with G and contain only uppercase letters and numbers",
  );

export const projectNameSchema = z
  .string()
  .min(4, "Project name must be at least 4 characters")
  .max(15, "Project name must be at most 15 characters")
  .regex(/^[a-z]+$/, "Project name can only contain lowercase letters (a-z)")
  .refine((name) => name.trim().length > 0, "Project name cannot be empty");

export const githubUrlSchema = z
  .string()
  .min(1, "GitHub URL is required")
  .url("Invalid URL format")
  .refine((url) => {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname !== "github.com") {
        return false;
      }
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      return pathParts.length === 2;
    } catch {
      return false;
    }
  }, "URL must be in format: https://github.com/username/repository");

export const githubHandleSchema = z
  .string()
  .min(1, "GitHub handle is required")
  .max(30, "GitHub handle must be 30 characters or less")
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Handle must contain only letters, digits, underscore, or dash",
  );

export const httpsUrlSchema = z
  .string()
  .url("Invalid URL format")
  .startsWith("https://", "URL must start with https://");

export const optionalHttpsUrlSchema = z
  .string()
  .optional()
  .refine(
    (url) => !url || url.startsWith("https://"),
    "URL must start with https://",
  );

export const proposalNameSchema = z
  .string()
  .min(10, "Proposal name must be at least 10 characters")
  .max(256, "Proposal name must be at most 256 characters")
  .refine((name) => name.trim().length > 0, "Proposal name is required");

export const textContentSchema = (minWords = 3, fieldName = "Text") =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .refine((text) => {
      const words = text.trim().split(/\s+/).length;
      return words >= minWords;
    }, `${fieldName} must contain at least ${minWords} words`);

// Complex form schemas
export const createProjectSchema = z.object({
  projectName: projectNameSchema,
  maintainerAddresses: z
    .array(stellarAddressSchema)
    .min(1, "At least one maintainer is required"),
  maintainerGithubs: z
    .array(githubHandleSchema)
    .min(1, "At least one GitHub handle is required"),
  githubRepoUrl: githubUrlSchema,
  orgName: z.string().min(1, "Organization name is required"),
  orgUrl: optionalHttpsUrlSchema,
  orgLogo: optionalHttpsUrlSchema,
  orgDescription: textContentSchema(3, "Organization description"),
});

export const joinCommunitySchema = z.object({
  address: stellarAddressSchema,
  name: z.string().optional(),
  social: optionalHttpsUrlSchema,
  description: z.string().optional(),
});

export const createProposalSchema = z.object({
  proposalName: proposalNameSchema,
  description: textContentSchema(10, "Proposal description"),
  approveDescription: textContentSchema(3, "Approved outcome description"),
  rejectDescription: z.string().optional(),
  cancelledDescription: z.string().optional(),
  approveXdr: z.string().optional(),
  rejectXdr: z.string().optional(),
  cancelledXdr: z.string().optional(),
  votingEndsAt: z
    .date()
    .min(
      new Date(Date.now() + 25 * 60 * 60 * 1000),
      "Voting must end at least 25 hours from now",
    ),
  isAnonymousVoting: z.boolean().default(false),
});

export const donationSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a positive number"),
  recipient: stellarAddressSchema,
});

// Validation helper functions that work with existing patterns
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
): string | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || "Validation failed";
    }
    return "Validation failed";
  }
}

export function validateObject<T>(
  schema: z.ZodSchema<T>,
  obj: unknown,
): { isValid: boolean; errors: Record<string, string> } {
  try {
    schema.parse(obj);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { _root: "Validation failed" } };
  }
}

// Utility functions for direct use
export const validateProjectName = (name: string): string | null =>
  validateField(projectNameSchema, name);

export const validateStellarAddress = (
  address: string,
  required = true,
): string | null =>
  validateField(
    required ? stellarAddressSchema : stellarAddressSchema.optional(),
    address,
  );

export const validateGithubUrl = (url: string): string | null =>
  validateField(githubUrlSchema, url);

export const validateMaintainerAddress = (address: string): string | null =>
  validateField(stellarAddressSchema, address);

export const validateUrl = (url: string, required = false): string | null =>
  validateField(required ? httpsUrlSchema : optionalHttpsUrlSchema, url);

export const validateProposalName = (name: string): string | null =>
  validateField(proposalNameSchema, name);

export const validateTextContent = (
  text: string,
  minWords = 3,
  fieldName = "Text",
): string | null => validateField(textContentSchema(minWords, fieldName), text);
