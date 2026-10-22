// AssignmentFiltersForm.tsx
// The assignment table's filters (class, due date range, hide completed), shown in a custom modal

import { type FormEvent, useId, useState } from "react";

import type { Class } from "../../model/Class";
import FormActions from "../form/FormActions";
import FormField from "../form/FormField";
import Input from "../form/Input";
import Select from "../form/Select";
import TertiaryButton from "../TertiaryButton";
import { type AssignmentFilters, NO_FILTERS } from "./assignmentFilters";

interface AssignmentFiltersFormProps {
    classes: Class[];
    initialValues: AssignmentFilters;
    onApply: (filters: AssignmentFilters) => void;
    onCancel: () => void;
}

const AssignmentFiltersForm = ({ classes, initialValues, onApply, onCancel }: AssignmentFiltersFormProps) => {
    // State
    // unique per form instance, so two open copies of a form (e.g. an edit pane and a "New" modal) don't share ids
    const formId = useId();
    const [values, setValues] = useState(initialValues);

    const rangeError =
        values.from && values.to && values.to < values.from ? "Must be on or after the start." : undefined;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!rangeError) onApply(values);
    };

    return (
        <form
            noValidate
            onSubmit={handleSubmit}
            className="space-y-4">
            <FormField
                id={`${formId}-class`}
                label="Class">
                <Select
                    id={`${formId}-class`}
                    autoFocus
                    value={values.classId}
                    onChange={e => setValues(v => ({ ...v, classId: e.target.value }))}>
                    <option value="">All classes</option>
                    {classes.map(cls => (
                        <option
                            key={cls.id}
                            value={cls.id}>
                            {cls.code} — {cls.name}
                        </option>
                    ))}
                </Select>
            </FormField>

            <fieldset className="space-y-4">
                <legend className="text-sm text-gray-600 mb-2">Due between</legend>
                <FormField
                    id={`${formId}-from`}
                    label="From">
                    <Input
                        id={`${formId}-from`}
                        type="date"
                        value={values.from}
                        onChange={e => setValues(v => ({ ...v, from: e.target.value }))}
                    />
                </FormField>
                <FormField
                    id={`${formId}-to`}
                    label="To"
                    error={rangeError}>
                    <Input
                        id={`${formId}-to`}
                        type="date"
                        min={values.from || undefined}
                        value={values.to}
                        invalid={!!rangeError}
                        onChange={e => setValues(v => ({ ...v, to: e.target.value }))}
                    />
                </FormField>
            </fieldset>

            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={values.showDone}
                    onChange={e => setValues(v => ({ ...v, showDone: e.target.checked }))}
                    className="w-4 h-4 accent-primary cursor-pointer"
                />
                Show completed
            </label>

            <FormActions
                submitting={false}
                submitLabel="Apply"
                submittingLabel="Apply"
                submitDisabled={!!rangeError}
                onCancel={onCancel}
                extraActions={<TertiaryButton onClick={() => setValues(NO_FILTERS)}>Reset</TertiaryButton>}
            />
        </form>
    );
};

export default AssignmentFiltersForm;
