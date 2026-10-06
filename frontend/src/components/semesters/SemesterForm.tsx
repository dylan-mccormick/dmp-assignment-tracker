// SemesterForm.tsx
// Name/start/end form for creating or editing a semester, with the same validation rules as the server

import { type FormEvent, type ReactNode, useState } from "react";

import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";

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

const inputClass = (invalid: boolean) =>
    `w-full px-3 py-2 border rounded transition-colors focus:outline-none focus:ring-2 ${invalid ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-primary/30"}`;

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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setAttempted(true);
        if (Object.keys(validate(values)).length > 0) return;

        setSubmitting(true);
        try {
            await onSubmit({ ...values, name: values.name.trim() });
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const field = (key: keyof SemesterFormValues, label: string, input: ReactNode) => (
        <div>
            <label
                htmlFor={`semester-${key}`}
                className="block text-sm text-gray-600 mb-1">
                {label}
            </label>
            {input}
            {errors[key] && (
                <p
                    id={`semester-${key}-error`}
                    className="text-sm text-red-700 mt-1">
                    {errors[key]}
                </p>
            )}
        </div>
    );

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className="space-y-4">
            {field(
                "name",
                "Name",
                <input
                    id="semester-name"
                    type="text"
                    autoFocus={!initialValues.name}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="e.g. Fall 2026"
                    value={values.name}
                    onChange={setField("name")}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "semester-name-error" : undefined}
                    className={inputClass(!!errors.name)}
                />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field(
                    "startDate",
                    "Start date",
                    <input
                        id="semester-startDate"
                        type="date"
                        value={values.startDate}
                        onChange={setField("startDate")}
                        aria-invalid={!!errors.startDate}
                        aria-describedby={errors.startDate ? "semester-startDate-error" : undefined}
                        className={inputClass(!!errors.startDate)}
                    />
                )}
                {field(
                    "endDate",
                    "End date",
                    <input
                        id="semester-endDate"
                        type="date"
                        min={values.startDate || undefined}
                        value={values.endDate}
                        onChange={setField("endDate")}
                        aria-invalid={!!errors.endDate}
                        aria-describedby={errors.endDate ? "semester-endDate-error" : undefined}
                        className={inputClass(!!errors.endDate)}
                    />
                )}
            </div>

            {formError && (
                <p
                    role="alert"
                    className="text-sm text-red-700">
                    {formError}
                </p>
            )}

            <div className="flex items-center gap-2 pt-2">
                <div className="flex-1">{extraActions}</div>
                {onCancel && (
                    <SecondaryButton
                        onClick={onCancel}
                        disabled={submitting}>
                        Cancel
                    </SecondaryButton>
                )}
                <PrimaryButton
                    type="submit"
                    disabled={submitting || (requireChanges && !changed)}>
                    {submitting ? submittingLabel : submitLabel}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default SemesterForm;
