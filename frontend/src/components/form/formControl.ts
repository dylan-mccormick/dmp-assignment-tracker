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
 * The id of a field's hint, for the control's aria-describedby
 *
 * @param id The control's id
 * @returns The hint's id
 */
export const fieldHintId = (id: string) => `${id}-hint`;

/**
 * The aria-describedby for a control: its hint and/or its error, when shown
 *
 * @param id The control's id
 * @param options Whether the field shows a hint and whether it's invalid (showing its error)
 * @returns The space-separated ids, or undefined when there are none
 */
export const describedBy = (id: string, { hint = false, invalid = false }: { hint?: boolean; invalid?: boolean }) =>
    [hint && fieldHintId(id), invalid && fieldErrorId(id)].filter(Boolean).join(" ") || undefined;

/**
 * The border and focus ring for a form control. Both stay at full strength (at least 3:1 against the surface, WCAG
 * 1.4.11), so the control's edge and its focus are visible to low-vision users
 *
 * @param invalid Whether the control has a validation error
 * @returns The Tailwind classes
 */
export const controlClass = (invalid = false) =>
    `px-3 py-2 border rounded transition-colors focus:outline-none focus:ring-2 ${invalid ? "border-red-500 focus:ring-red-500" : "border-gray-500 focus:ring-primary"}`;

/**
 * Focuses a form's first invalid control, after a submit that failed validation: its label and error are then read out,
 * instead of the submit button staying focused with nothing announced. Render the errors first (flushSync)
 *
 * @param form The form element
 */
export const focusFirstInvalid = (form: HTMLFormElement) =>
    form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
