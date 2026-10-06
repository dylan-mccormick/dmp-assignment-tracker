// Input.tsx
// A styled text/date input that marks itself invalid and points at its FormField error

import type { InputHTMLAttributes } from "react";

import { controlClass, fieldErrorId } from "./formControl";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
    id: string;
    invalid?: boolean;
}

const Input = ({ id, invalid = false, ...props }: InputProps) => (
    <input
        id={id}
        aria-invalid={invalid}
        aria-describedby={invalid ? fieldErrorId(id) : undefined}
        className={`w-full ${controlClass(invalid)}`}
        {...props}
    />
);

export default Input;
