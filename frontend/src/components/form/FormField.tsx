// FormField.tsx
// A labelled form control with an optional hint and its validation error below it

import type { ReactNode } from "react";

import { fieldErrorId, fieldHintId } from "./formControl";

interface FormFieldProps {
    /** The control's id, which the label points at */
    id: string;
    label: string;
    /** Help text shown below the control (pass `hint` to the control too, so it's announced) */
    hint?: ReactNode;
    /** Shown below the control when set */
    error?: string;
    /** The control, e.g. an Input */
    children: ReactNode;
}

const FormField = ({ id, label, hint, error, children }: FormFieldProps) => (
    <div>
        <label
            htmlFor={id}
            className="block text-sm text-gray-600 mb-1">
            {label}
        </label>
        {children}
        {hint && (
            <p
                id={fieldHintId(id)}
                className="text-xs text-gray-500 mt-1">
                {hint}
            </p>
        )}
        {error && (
            <p
                id={fieldErrorId(id)}
                className="text-sm text-red-700 mt-1">
                {error}
            </p>
        )}
    </div>
);

export default FormField;
