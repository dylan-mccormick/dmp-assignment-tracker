// formControl.ts
// Shared ids and styling for form controls (kept out of the component files so fast refresh keeps working)

/**
 * The id of a field's error message, for the control's aria-describedby
 *
 * @param id The control's id
 * @returns The error message's id
 */
export const fieldErrorId = (id: string) => `${id}-error`;

/**
 * The border and focus ring for a form control
 *
 * @param invalid Whether the control has a validation error
 * @returns The Tailwind classes
 */
export const controlClass = (invalid = false) =>
    `px-3 py-2 border rounded transition-colors focus:outline-none focus:ring-2 ${invalid ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-primary/30"}`;
