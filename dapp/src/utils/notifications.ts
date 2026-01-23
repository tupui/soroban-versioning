import { toast } from "./utils";

/**
 * Notification utility for displaying error toast messages to users
 * This replaces console logs with proper UI notifications
 */

/**
 * Show an error toast notification to the user
 * @param title The error title
 * @param message The error message
 */
export function showError(title: string, message: string): void {
  // Implementation depends on the toast library used in the project
  // Here we rely on the existing toast.error function from utils.ts
  toast.error(title, message);
}
