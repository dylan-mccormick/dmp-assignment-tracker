// FormActions.tsx
// The bottom of a form: its submission error, then extra actions on the left and Cancel/submit on the right

import type { ReactNode } from "react";

import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";

interface FormActionsProps {
    /** A submission error, e.g. from the server */
    error?: string;
    submitting: boolean;
    submitLabel: string;
    submittingLabel: string;
    /** Disables the submit button (it's always disabled while submitting) */
    submitDisabled?: boolean;
    /** Shows a Cancel button when given */
    onCancel?: () => void;
    /** Extra buttons on the left (e.g. Delete) */
    extraActions?: ReactNode;
}

const FormActions = ({
    error,
    submitting,
    submitLabel,
    submittingLabel,
    submitDisabled,
    onCancel,
    extraActions
}: FormActionsProps) => (
    <>
        {error && (
            <p
                role="alert"
                className="text-sm text-red-700">
                {error}
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
                disabled={submitting || submitDisabled}>
                {submitting ? submittingLabel : submitLabel}
            </PrimaryButton>
        </div>
    </>
);

export default FormActions;
