// ClassForm.tsx
// Name/code (and optionally semester) form for creating or editing a class, with the same validation rules as the server

import { type FormEvent, type ReactNode, useId, useState } from "react";
import { flushSync } from "react-dom";

import type { Semester } from "../../model/Semester";
import FormActions from "../form/FormActions";
import { focusFirstInvalid } from "../form/formControl";
import FormField from "../form/FormField";
import Input from "../form/Input";
import SemesterSelect from "./SemesterSelect";

export interface ClassFormValues {
    semesterId: string;
    name: string;
    code: string;
}

type FieldErrors = Partial<Record<keyof ClassFormValues, string>>;

const MAX_NAME_LENGTH = 100;
const MAX_CODE_LENGTH = 20;

const validate = ({ name, code }: ClassFormValues): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "A class needs a name.";
    else if (name.trim().length > MAX_NAME_LENGTH) errors.name = `At most ${MAX_NAME_LENGTH} characters.`;
    if (!code.trim()) errors.code = "A class needs a code.";
    else if (code.trim().length > MAX_CODE_LENGTH) errors.code = `At most ${MAX_CODE_LENGTH} characters.`;
    return errors;
};

interface ClassFormProps {
    initialValues: ClassFormValues;
    /** Shows a semester dropdown (to move the class) when given */
    semesters?: Semester[];
    submitLabel: string;
    submittingLabel: string;
    /** Saves the values; throw an Error to show its message in the form */
    onSubmit: (values: ClassFormValues) => Promise<void>;
    /** Shows a Cancel button when given */
    onCancel?: () => void;
    /** Keep the submit button disabled until something changes (for editing) */
    requireChanges?: boolean;
    /** Extra buttons on the left of the action row (e.g. Delete) */
    extraActions?: ReactNode;
}

const ClassForm = ({
    initialValues,
    semesters,
    submitLabel,
    submittingLabel,
    onSubmit,
    onCancel,
    requireChanges,
    extraActions
}: ClassFormProps) => {
    // State
    // unique per form instance, so two open copies of a form (e.g. an edit pane and a "New" modal) don't share ids
    const formId = useId();
    const [values, setValues] = useState(initialValues);
    const [attempted, setAttempted] = useState(false); // show field errors once the user tries to submit
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>();

    const errors = attempted ? validate(values) : {};
    const changed =
        values.semesterId !== initialValues.semesterId ||
        values.name !== initialValues.name ||
        values.code !== initialValues.code;

    const setValue = (field: keyof ClassFormValues, value: string) => {
        setValues(v => ({ ...v, [field]: value }));
        setFormError(undefined);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (Object.keys(validate(values)).length > 0) {
            flushSync(() => setAttempted(true));
            focusFirstInvalid(form);
            return;
        }
        setAttempted(true);

        setSubmitting(true);
        try {
            await onSubmit({ ...values, name: values.name.trim(), code: values.code.trim() });
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                    <FormField
                        id={`${formId}-name`}
                        label="Name"
                        error={errors.name}>
                        <Input
                            id={`${formId}-name`}
                            required
                            type="text"
                            autoFocus={!initialValues.name}
                            maxLength={MAX_NAME_LENGTH}
                            placeholder="e.g. Networks and Distributed Systems"
                            value={values.name}
                            onChange={e => setValue("name", e.target.value)}
                            invalid={!!errors.name}
                        />
                    </FormField>
                </div>
                <FormField
                    id={`${formId}-code`}
                    label="Code"
                    error={errors.code}>
                    <Input
                        id={`${formId}-code`}
                        required
                        type="text"
                        maxLength={MAX_CODE_LENGTH}
                        placeholder="e.g. CS 3700"
                        value={values.code}
                        onChange={e => setValue("code", e.target.value)}
                        invalid={!!errors.code}
                    />
                </FormField>
            </div>

            {semesters && (
                <FormField
                    id={`${formId}-semesterId`}
                    label="Semester">
                    <SemesterSelect
                        id={`${formId}-semesterId`}
                        semesters={semesters}
                        value={values.semesterId}
                        onChange={semesterId => setValue("semesterId", semesterId)}
                        disabled={submitting}
                        className="w-full"
                    />
                </FormField>
            )}

            <FormActions
                error={formError}
                submitting={submitting}
                submitLabel={submitLabel}
                submittingLabel={submittingLabel}
                submitDisabled={requireChanges && !changed}
                onCancel={onCancel}
                extraActions={extraActions}
            />
        </form>
    );
};

export default ClassForm;
