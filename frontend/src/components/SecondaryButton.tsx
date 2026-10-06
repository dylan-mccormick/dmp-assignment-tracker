// SecondaryButton.tsx
// A button component with secondary (outlined) styling

interface SecondaryButtonProps {
    onClick?: () => void;
    type?: "button" | "submit";
    children?: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
}

const SecondaryButton = ({ onClick, type = "button", children, disabled, danger }: SecondaryButtonProps) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`cursor-pointer border-2 ${danger ? "border-red-700 text-red-700 enabled:hover:bg-red-50" : "border-primary text-primary enabled:hover:bg-blue-50"} enabled:active:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out py-0.5 px-4 rounded`}
            disabled={disabled}>
            {children}
        </button>
    );
};

export default SecondaryButton;
