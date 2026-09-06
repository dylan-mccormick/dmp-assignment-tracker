// TertiaryButton.tsx
// A button component with tertiary (link-like) styling

interface TertiaryButtonProps {
    onClick?: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
}

const TertiaryButton = ({ onClick, children, disabled }: TertiaryButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="cursor-pointer text-blue-500 hover:text-blue-600 active:text-blue-700 disabled:text-blue-200 disabled:cursor-not-allowed transition-all duration-200 ease-in-out underline py-1 px-4 rounded"
            disabled={disabled}>
            {children}
        </button>
    );
};

export default TertiaryButton;
