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
    /** The entered item's key, or undefined while just the list is shown */
    selectedKey: string | undefined;
    /** Called with an item's key when it's entered, and with undefined when the detail pane is closed */
    onSelect: (itemKey: string | undefined) => void;
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
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        className={`cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black active:scale-90 transition duration-150 ease-out motion-reduce:transition-none ${className}`}>
        {children}
    </button>
);

const SplitPane = ({ children, selectedKey, onSelect, renderDetail, renderDetailTitle }: SplitPaneProps) => {
    // State
    const [expanded, setExpanded] = useState(false);

    // collapse back to the split view whenever the detail pane closes (including when the parent closes it)
    const [previousKey, setPreviousKey] = useState(selectedKey);
    if (selectedKey !== previousKey) {
        setPreviousKey(selectedKey);
        if (selectedKey === undefined) setExpanded(false);
    }

    const enter = useCallback((itemKey: string) => onSelect(itemKey), [onSelect]);
    const close = () => onSelect(undefined);

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
    /** The row's content. The whole row is a button, so this must not contain buttons, links or inputs */
    children: ReactNode;
}

export const SplitPaneItem = ({ itemKey, children }: SplitPaneItemProps) => {
    const { selectedKey, enter } = useContext(SplitPaneContext);
    const selected = selectedKey === itemKey;

    return (
        <li>
            <button
                type="button"
                aria-current={selected || undefined}
                onClick={() => enter(itemKey)}
                className={`group w-full flex items-center gap-2 px-4 py-3 text-left cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${selected ? "bg-gray-100" : "hover:bg-gray-50"}`}>
                <div className="flex-1 min-w-0">{children}</div>
                {/* decorative: the whole row is the button */}
                <ChevronRight
                    aria-hidden="true"
                    className="shrink-0 w-5 h-5 text-gray-400 transition duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-gray-600 motion-reduce:transition-none"
                />
            </button>
        </li>
    );
};

export default SplitPane;
