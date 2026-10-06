// TextArea.tsx
// A styled, vertically resizable textarea that marks itself invalid and points at its FormField hint and error

import type { TextareaHTMLAttributes } from "react";

import { controlClass, describedBy } from "./formControl";

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
    id: string;
    invalid?: boolean;
    /** Set when the FormField shows a hint */
    hint?: boolean;
}

const TextArea = ({ id, invalid = false, hint, ...props }: TextAreaProps) => (
    <textarea
        id={id}
        aria-invalid={invalid}
        aria-describedby={describedBy(id, { hint, invalid })}
        className={`w-full resize-y ${controlClass(invalid)}`}
        {...props}
    />
);

export default TextArea;
