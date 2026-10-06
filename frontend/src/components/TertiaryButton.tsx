// TertiaryButton.tsx
// A button component with tertiary (link-like) styling

interface TertiaryButtonProps {
    onClick?: () => void;
    type?: "button" | "submit";
    children?: React.ReactNode;
    disabled?: boolean;
}

const TertiaryButton = ({ onClick, type = "button", children, disabled }: TertiaryButtonProps) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className="cursor-pointer text-primary enabled:active:text-blue-600 underline disabled:no-underline disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
            disabled={disabled}>
            {children}
        </button>
    );
};

export default TertiaryButton;
