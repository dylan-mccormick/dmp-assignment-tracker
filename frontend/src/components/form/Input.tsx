// Input.tsx
// A styled text/date input that marks itself invalid and points at its FormField hint and error

import type { InputHTMLAttributes } from "react";

import { controlClass, describedBy } from "./formControl";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
    id: string;
    invalid?: boolean;
    /** Set when the FormField shows a hint */
    hint?: boolean;
}

const Input = ({ id, invalid = false, hint, ...props }: InputProps) => (
    <input
        id={id}
        aria-invalid={invalid}
        aria-describedby={describedBy(id, { hint, invalid })}
        className={`w-full ${controlClass(invalid)}`}
        {...props}
    />
);

export default Input;
