/**
 * Safe DOM manipulation utilities to prevent XSS vulnerabilities
 */

/**
 * Safely sets text content without risk of HTML injection
 */
export function setTextContent(element: Element, text: string): void {
  element.textContent = text;
}

/**
 * Safely clears an element's content
 */
export function clearElement(element: Element): void {
  element.textContent = "";
}

/**
 * Creates a text node safely
 */
export function createTextNode(text: string): Text {
  return document.createTextNode(text);
}

/**
 * Creates an element with safe attributes
 */
export function createElement(
  tagName: string,
  attributes?: Record<string, string>,
): HTMLElement {
  const element = document.createElement(tagName);

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      // Only allow safe attributes
      if (isSafeAttribute(key)) {
        element.setAttribute(key, value);
      }
    }
  }

  return element;
}

/**
 * List of safe HTML attributes that don't pose XSS risks
 */
const SAFE_ATTRIBUTES = new Set([
  "id",
  "class",
  "className",
  "title",
  "alt",
  "src",
  "href",
  "target",
  "rel",
  "type",
  "value",
  "placeholder",
  "disabled",
  "readonly",
  "required",
  "hidden",
  "aria-label",
  "aria-hidden",
  "role",
  "tabindex",
]);

function isSafeAttribute(attribute: string): boolean {
  return (
    SAFE_ATTRIBUTES.has(attribute) &&
    !attribute.toLowerCase().startsWith("on") && // No event handlers
    !attribute.toLowerCase().includes("script")
  ); // No script-related attributes
}
