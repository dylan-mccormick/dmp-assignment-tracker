// PrimaryButton.tsx
// A button component with primary styling

interface PrimaryButtonProps {
    onClick?: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
}

const PrimaryButton = ({ onClick, children, disabled, danger }: PrimaryButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`cursor-pointer ${danger ? "bg-red-700 enabled:hover:bg-red-700/90 enabled:active:bg-red-600" : "bg-primary enabled:hover:bg-primary/90 enabled:active:bg-blue-600"} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out text-white py-1 px-4 rounded`}
            disabled={disabled}>
            {children}
        </button>
    );
};

export default PrimaryButton;
