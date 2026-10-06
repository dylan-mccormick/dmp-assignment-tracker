// ProgressBar.tsx
// A thin meter: a primary fill on a lighter track of the same hue

interface ProgressBarProps {
    /** 0 to 1 */
    fraction: number;
    /** Accessible name, e.g. "CS 3700 assignments done" */
    label: string;
    /** Read out instead of the bare percentage, e.g. "3 of 5" */
    valueText?: string;
    size?: "sm" | "md";
}

const ProgressBar = ({ fraction, label, valueText, size = "sm" }: ProgressBarProps) => {
    const percent = Math.round(Math.min(Math.max(fraction, 0), 1) * 100);

    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={valueText}
            className={`w-full rounded-full bg-primary/15 overflow-hidden ${size === "md" ? "h-3" : "h-2"}`}>
            <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
                // any progress at all stays visible as a sliver
                style={{ width: percent > 0 ? `max(${percent}%, 0.5rem)` : 0 }}
            />
        </div>
    );
};

export default ProgressBar;
