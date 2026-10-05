// SplitPane.tsx
// A list that splits into list + detail when an item is entered, with the detail pane expandable to full width.
// Reusable: pass SplitPaneItems as children and render the detail for the selected item's key.

import { ChevronRight, Maximize2, Minimize2, X } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

interface SplitPaneContextInterface {
    selectedKey: string | undefined;
    enter: (itemKey: string) => void;
}

const SplitPaneContext = createContext<SplitPaneContextInterface>({
    selectedKey: undefined,
    enter: () => {}
});

interface SplitPaneProps {
    /** The list rows: SplitPaneItems */
    children: ReactNode;
    /** Renders the detail pane for the entered item */
    renderDetail: (selectedKey: string) => ReactNode;
    /** Optional heading shown in the detail pane's toolbar */
    renderDetailTitle?: (selectedKey: string) => ReactNode;
}

const PaneButton = ({
    label,
    onClick,
    className = "",
    children
}: {
    label: string;
    onClick: () => void;
    className?: string;
    children: ReactNode;
}) => (
    <button
        aria-label={label}
        title={label}
        onClick={onClick}
        className={`cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black active:scale-90 transition duration-150 ease-out motion-reduce:transition-none ${className}`}>
        {children}
    </button>
);

const SplitPane = ({ children, renderDetail, renderDetailTitle }: SplitPaneProps) => {
    // State
    const [selectedKey, setSelectedKey] = useState<string>();
    const [expanded, setExpanded] = useState(false);

    const enter = useCallback((itemKey: string) => setSelectedKey(itemKey), []);
    const close = () => {
        setSelectedKey(undefined);
        setExpanded(false);
    };

    const open = selectedKey !== undefined;
    const full = open && expanded;

    // list: full width while nothing is open, half in split view, hidden when the detail is expanded
    // (on small screens there's no room to split, so an open detail always takes the full width)
    const listWidth = !open ? "w-full" : full ? "hidden" : "hidden md:block md:w-1/2";

    return (
        <SplitPaneContext.Provider value={{ selectedKey, enter }}>
            <div className="flex w-full">
                <div className={`min-w-0 ${listWidth}`}>
                    <ul className="divide-y divide-gray-200 border-y border-gray-200">{children}</ul>
                </div>

                {open && (
                    <section
                        aria-label="Details"
                        className={`min-w-0 w-full border-gray-200 transition-[opacity,translate] duration-200 ease-out starting:opacity-0 starting:translate-x-4 motion-reduce:transition-none ${full ? "" : "md:w-1/2 md:border-l"}`}>
                        <div className="flex items-center justify-between gap-2 px-4 py-3 border-y border-gray-200">
                            <div className="min-w-0 truncate font-medium">{renderDetailTitle?.(selectedKey)}</div>
                            <div className="flex items-center gap-1 shrink-0">
                                <PaneButton
                                    label={full ? "Back to split view" : "Expand"}
                                    onClick={() => setExpanded(e => !e)}
                                    className="hidden md:inline-flex">
                                    {full ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                </PaneButton>
                                <PaneButton
                                    label="Close"
                                    onClick={close}>
                                    <X className="w-5 h-5" />
                                </PaneButton>
                            </div>
                        </div>
                        <div className="p-4">{renderDetail(selectedKey)}</div>
                    </section>
                )}
            </div>
        </SplitPaneContext.Provider>
    );
};

interface SplitPaneItemProps {
    /** Identifies the item; passed to renderDetail when entered */
    itemKey: string;
    /** Accessible name for the enter button, e.g. the item's name */
    label?: string;
    /** The row's content */
    children: ReactNode;
}

export const SplitPaneItem = ({ itemKey, label, children }: SplitPaneItemProps) => {
    const { selectedKey, enter } = useContext(SplitPaneContext);
    const selected = selectedKey === itemKey;

    return (
        <li
            aria-current={selected || undefined}
            className={`group flex items-center gap-2 px-4 py-3 transition-colors duration-150 ${selected ? "bg-gray-100" : "hover:bg-gray-50"}`}>
            <div className="flex-1 min-w-0">{children}</div>
            <PaneButton
                label={label ? `Open ${label}` : "Open"}
                onClick={() => enter(itemKey)}
                className={selected ? "hover:bg-gray-200" : ""}>
                <ChevronRight className="w-5 h-5 transition-transform duration-150 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </PaneButton>
        </li>
    );
};

export default SplitPane;
