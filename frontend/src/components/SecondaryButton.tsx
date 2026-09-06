// SecondaryButton.tsx
// A button component with secondary styling

interface SecondaryButtonProps {
    onClick?: () => void;
    children?: React.ReactNode;
    disabled?: boolean;
    danger?: boolean;
}

const SecondaryButton = ({ onClick, children, disabled, danger }: SecondaryButtonProps) => {
    return <button onClick={onClick}
        className={`cursor-pointer ${danger ? 'bg-red-200 border text-red-500 border-red-500 hover:bg-red-300 active:bg-red-400 active:text-red-100 disabled:bg-red-100 disabled:text-red-200 disabled:border-0' : 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-100 disabled:text-blue-200'} disabled:cursor-not-allowed transition-all duration-200 ease-in-out text-blue-500 py-1 px-4 rounded`} disabled={disabled}>
        {children}
    </button>
};

export default SecondaryButton;