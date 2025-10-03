import { useState, useCallback } from "react";

export interface ValidationRule<T = any> {
  field: keyof T;
  validate: (value: any, formData: T) => string | null | Promise<string | null>;
  required?: boolean;
}

export type FormErrors<T = any> = {
  [K in keyof T]?: string | null;
};

/**
 * Custom hook for form validation with async support.
 * Handles common patterns: field validation, error state management, and bulk validation.
 */
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  rules: ValidationRule<T>[] = [],
) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Update a single field and clear its error
  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const clearedErrors = Object.keys(updates).reduce((acc, key) => {
      acc[key as keyof T] = null;
      return acc;
    }, {} as FormErrors<T>);
    setErrors((prev) => ({ ...prev, ...clearedErrors }));
  }, []);

  // Validate a single field
  const validateField = useCallback(
    async (field: keyof T): Promise<boolean> => {
      const rule = rules.find((r) => r.field === field);
      if (!rule) return true;

      try {
        const error = await rule.validate(formData[field], formData);
        setErrors((prev) => ({ ...prev, [field]: error }));
        return error === null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Validation failed";
        setErrors((prev) => ({ ...prev, [field]: errorMessage }));
        return false;
      }
    },
    [formData, rules],
  );

  // Validate all fields
  const validateForm = useCallback(async (): Promise<boolean> => {
    if (rules.length === 0) return true;

    setIsValidating(true);
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    for (const rule of rules) {
      try {
        const error = await rule.validate(formData[rule.field], formData);
        newErrors[rule.field] = error;
        if (error !== null) {
          isValid = false;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Validation failed";
        newErrors[rule.field] = errorMessage;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setIsValidating(false);
    return isValid;
  }, [formData, rules]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsValidating(false);
  }, [initialData]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Get error for a specific field
  const getFieldError = useCallback(
    (field: keyof T): string | null => {
      return errors[field] || null;
    },
    [errors],
  );

  // Check if form has any errors
  const hasErrors = Object.values(errors).some((error) => error !== null);

  return {
    formData,
    errors,
    isValidating,
    hasErrors,
    updateField,
    updateFields,
    validateField,
    validateForm,
    resetForm,
    clearErrors,
    getFieldError,
  };
}
