// SemesterForm.tsx
// Name/start/end form for creating or editing a semester, with the same validation rules as the server

import { type FormEvent, type ReactNode, useId, useState } from "react";
import { flushSync } from "react-dom";

import FormActions from "../form/FormActions";
import { focusFirstInvalid } from "../form/formControl";
import FormField from "../form/FormField";
import Input from "../form/Input";

export interface SemesterFormValues {
    name: string;
    startDate: string;
    endDate: string;
}

type FieldErrors = Partial<Record<keyof SemesterFormValues, string>>;

const MAX_NAME_LENGTH = 100;

const validate = ({ name, startDate, endDate }: SemesterFormValues): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "A semester needs a name.";
    else if (name.trim().length > MAX_NAME_LENGTH) errors.name = `At most ${MAX_NAME_LENGTH} characters.`;
    if (!startDate) errors.startDate = "Pick a start date.";
    if (!endDate) errors.endDate = "Pick an end date.";
    else if (startDate && endDate < startDate) errors.endDate = "The end date can't be before the start date.";
    return errors;
};

interface SemesterFormProps {
    initialValues?: SemesterFormValues;
    submitLabel: string;
    submittingLabel: string;
    /** Saves the values; throw an Error to show its message in the form */
    onSubmit: (values: SemesterFormValues) => Promise<void>;
    /** Shows a Cancel button when given */
    onCancel?: () => void;
    /** Keep the submit button disabled until something changes (for editing) */
    requireChanges?: boolean;
    /** Extra buttons on the left of the action row (e.g. Delete) */
    extraActions?: ReactNode;
}

const SemesterForm = ({
    initialValues = { name: "", startDate: "", endDate: "" },
    submitLabel,
    submittingLabel,
    onSubmit,
    onCancel,
    requireChanges,
    extraActions
}: SemesterFormProps) => {
    // State
    // unique per form instance, so two open copies of a form (e.g. an edit pane and a "New" modal) don't share ids
    const formId = useId();
    const [values, setValues] = useState(initialValues);
    const [attempted, setAttempted] = useState(false); // show field errors once the user tries to submit
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>();

    const errors = attempted ? validate(values) : {};
    const changed =
        values.name !== initialValues.name ||
        values.startDate !== initialValues.startDate ||
        values.endDate !== initialValues.endDate;

    const setField = (field: keyof SemesterFormValues) => (e: { target: { value: string } }) => {
        setValues(v => ({ ...v, [field]: e.target.value }));
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
            await onSubmit({ ...values, name: values.name.trim() });
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
                    placeholder="e.g. Fall 2026"
                    value={values.name}
                    onChange={setField("name")}
                    invalid={!!errors.name}
                />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    id={`${formId}-startDate`}
                    label="Start date"
                    error={errors.startDate}>
                    <Input
                        id={`${formId}-startDate`}
                        required
                        type="date"
                        value={values.startDate}
                        onChange={setField("startDate")}
                        invalid={!!errors.startDate}
                    />
                </FormField>
                <FormField
                    id={`${formId}-endDate`}
                    label="End date"
                    error={errors.endDate}>
                    <Input
                        id={`${formId}-endDate`}
                        required
                        type="date"
                        min={values.startDate || undefined}
                        value={values.endDate}
                        onChange={setField("endDate")}
                        invalid={!!errors.endDate}
                    />
                </FormField>
            </div>

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

export default SemesterForm;
