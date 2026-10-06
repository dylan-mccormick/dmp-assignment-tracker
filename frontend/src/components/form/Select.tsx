// Select.tsx
// A styled select that marks itself invalid and points at its FormField hint and error

import type { SelectHTMLAttributes } from "react";

import { controlClass, describedBy } from "./formControl";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
    id: string;
    invalid?: boolean;
    /** Set when the FormField shows a hint */
    hint?: boolean;
}

const Select = ({ id, invalid = false, hint, children, ...props }: SelectProps) => (
    <select
        id={id}
        aria-invalid={invalid}
        aria-describedby={describedBy(id, { hint, invalid })}
        className={`w-full bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${controlClass(invalid)}`}
        {...props}>
        {children}
    </select>
);

export default Select;
