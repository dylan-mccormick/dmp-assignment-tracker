// PrimaryButton.tsx
// A button component with primary styling

interface PrimaryButtonProps {
    onClick?: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
}

const PrimaryButton = ({ onClick, children, disabled }: PrimaryButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="cursor-pointer bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-200 disabled:cursor-not-allowed transition-all duration-200 ease-in-out text-white font py-1 px-4 rounded"
            disabled={disabled}>
            {children}
        </button>
    );
};

export default PrimaryButton;
