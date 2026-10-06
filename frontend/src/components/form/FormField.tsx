// FormField.tsx
// A labelled form control with its validation error below it

import type { ReactNode } from "react";

import { fieldErrorId } from "./formControl";

interface FormFieldProps {
    /** The control's id, which the label points at */
    id: string;
    label: string;
    /** Shown below the control when set */
    error?: string;
    /** The control, e.g. an Input */
    children: ReactNode;
}

const FormField = ({ id, label, error, children }: FormFieldProps) => (
    <div>
        <label
            htmlFor={id}
            className="block text-sm text-gray-600 mb-1">
            {label}
        </label>
        {children}
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
