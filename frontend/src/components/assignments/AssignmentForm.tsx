// AssignmentForm.tsx
// Every editable field of an assignment, with hints for the optional deadlines and a large notes area, validated by
// the same rules as the server

import { type FormEvent, type ReactNode, useState } from "react";

import type { AssignmentType } from "../../model/Assignment";
import type { Class } from "../../model/Class";
import type { Semester } from "../../model/Semester";
import FormActions from "../form/FormActions";
import FormField from "../form/FormField";
import Input from "../form/Input";
import Select from "../form/Select";
import TextArea from "../form/TextArea";

export interface AssignmentFormValues {
    name: string;
    typeId: string;
    classId: string;
    done: boolean;
    earlyDue: string; // datetime-local value, "" for none
    due: string; // datetime-local value
    lateDue: string; // datetime-local value, "" for none
    notes: string;
}

type FieldErrors = Partial<Record<keyof AssignmentFormValues, string>>;

const MAX_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 10_000;

// datetime-local values ("YYYY-MM-DDTHH:mm") compare correctly as strings
const validate = ({ name, typeId, classId, earlyDue, due, lateDue, notes }: AssignmentFormValues): FieldErrors => {
    const errors: FieldErrors = {};
    if (!name.trim()) errors.name = "An assignment needs a name.";
    else if (name.trim().length > MAX_NAME_LENGTH) errors.name = `At most ${MAX_NAME_LENGTH} characters.`;
    if (!typeId) errors.typeId = "Pick a type.";
    if (!classId) errors.classId = "Pick a class.";
    if (!due) errors.due = "Pick a due date.";
    if (earlyDue && due && earlyDue > due) errors.earlyDue = "The early deadline can't be after the due date.";
    if (lateDue && due && lateDue < due) errors.lateDue = "The late deadline can't be before the due date.";
    if (notes.length > MAX_NOTES_LENGTH) errors.notes = `At most ${MAX_NOTES_LENGTH.toLocaleString()} characters.`;
    return errors;
};

interface AssignmentFormProps {
    initialValues: AssignmentFormValues;
    types: AssignmentType[];
    semesters: Semester[];
    /** Every class of the user's, grouped by semester in the class dropdown (so an assignment can move semesters) */
    classes: Class[];
    submitLabel: string;
    submittingLabel: string;
    /** Saves the values; throw an Error to show its message in the form */
    onSubmit: (values: AssignmentFormValues) => Promise<void>;
    /** Shows a Cancel button when given */
    onCancel?: () => void;
    /** Keep the submit button disabled until something changes (for editing) */
    requireChanges?: boolean;
    /** Extra buttons on the left of the action row (e.g. Delete) */
    extraActions?: ReactNode;
}

const AssignmentForm = ({
    initialValues,
    types,
    semesters,
    classes,
    submitLabel,
    submittingLabel,
    onSubmit,
    onCancel,
    requireChanges,
    extraActions
}: AssignmentFormProps) => {
    // State
    const [values, setValues] = useState(initialValues);
    const [attempted, setAttempted] = useState(false); // show field errors once the user tries to submit
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string>();

    const errors = attempted ? validate(values) : {};
    const changed = (Object.keys(values) as (keyof AssignmentFormValues)[]).some(
        key => values[key] !== initialValues[key]
    );

    const setValue = <K extends keyof AssignmentFormValues>(field: K, value: AssignmentFormValues[K]) => {
        setValues(v => ({ ...v, [field]: value }));
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

    // Classes grouped under their semester, newest semester first (the API's semester order)
    const classGroups = semesters
        .map(semester => ({ semester, classes: classes.filter(c => c.semesterId === semester.id) }))
        .filter(group => group.classes.length > 0);

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className="space-y-6">
            <FormField
                id="assignment-name"
                label="Name"
                error={errors.name}>
                <Input
                    id="assignment-name"
                    type="text"
                    autoFocus={!initialValues.name}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="e.g. Homework 3"
                    value={values.name}
                    onChange={e => setValue("name", e.target.value)}
                    invalid={!!errors.name}
                />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    id="assignment-classId"
                    label="Class"
                    error={errors.classId}>
                    <Select
                        id="assignment-classId"
                        value={values.classId}
                        onChange={e => setValue("classId", e.target.value)}
                        invalid={!!errors.classId}>
                        {!values.classId && <option value="">Pick a class</option>}
                        {classGroups.map(({ semester, classes: groupClasses }) => (
                            <optgroup
                                key={semester.id}
                                label={semester.name}>
                                {groupClasses.map(cls => (
                                    <option
                                        key={cls.id}
                                        value={cls.id}>
                                        {cls.code} — {cls.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </Select>
                </FormField>
                <FormField
                    id="assignment-typeId"
                    label="Type"
                    error={errors.typeId}>
                    <Select
                        id="assignment-typeId"
                        value={values.typeId}
                        onChange={e => setValue("typeId", e.target.value)}
                        invalid={!!errors.typeId}>
                        {!values.typeId && <option value="">Pick a type</option>}
                        {types.map(type => (
                            <option
                                key={type.id}
                                value={type.id}>
                                {type.value}
                            </option>
                        ))}
                    </Select>
                </FormField>
            </div>

            <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-3">Deadlines</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        id="assignment-earlyDue"
                        label="Early due (optional)"
                        hint="An earlier deadline, e.g. for early-submission credit. Must be on or before the due date."
                        error={errors.earlyDue}>
                        <Input
                            id="assignment-earlyDue"
                            type="datetime-local"
                            max={values.due || undefined}
                            value={values.earlyDue}
                            onChange={e => setValue("earlyDue", e.target.value)}
                            invalid={!!errors.earlyDue}
                            hint
                        />
                    </FormField>
                    <FormField
                        id="assignment-due"
                        label="Due"
                        hint="The main deadline."
                        error={errors.due}>
                        <Input
                            id="assignment-due"
                            type="datetime-local"
                            value={values.due}
                            onChange={e => setValue("due", e.target.value)}
                            invalid={!!errors.due}
                            hint
                        />
                    </FormField>
                    <FormField
                        id="assignment-lateDue"
                        label="Late due (optional)"
                        hint="The last time a late submission is accepted, often with a penalty. Must be on or after the due date."
                        error={errors.lateDue}>
                        <Input
                            id="assignment-lateDue"
                            type="datetime-local"
                            min={values.due || undefined}
                            value={values.lateDue}
                            onChange={e => setValue("lateDue", e.target.value)}
                            invalid={!!errors.lateDue}
                            hint
                        />
                    </FormField>
                </div>
            </fieldset>

            <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                    type="checkbox"
                    checked={values.done}
                    onChange={e => setValue("done", e.target.checked)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                />
                Completed
            </label>

            <FormField
                id="assignment-notes"
                label="Notes"
                hint={`${values.notes.length.toLocaleString()} / ${MAX_NOTES_LENGTH.toLocaleString()} characters`}
                error={errors.notes}>
                <TextArea
                    id="assignment-notes"
                    rows={12}
                    placeholder="Instructions, links, what's left to do..."
                    value={values.notes}
                    onChange={e => setValue("notes", e.target.value)}
                    invalid={!!errors.notes}
                    hint
                />
            </FormField>

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

export default AssignmentForm;
