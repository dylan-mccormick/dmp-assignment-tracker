// Pagination.tsx
// Page controls for a list: rows per page, the range shown, and previous/next

import { ChevronLeft, ChevronRight } from "lucide-react";

import { PAGE_SIZES } from "../pagination";
import { controlClass } from "./form/formControl";

interface PaginationProps {
    /** 1-based */
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
}

const PageButton = ({
    label,
    disabled,
    onClick,
    children
}: {
    label: string;
    disabled: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={onClick}
        className="p-1.5 rounded cursor-pointer text-gray-700 enabled:hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
        {children}
    </button>
);

const Pagination = ({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) => {
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-sm text-gray-600">
            <label className="flex items-center gap-2">
                Rows per page
                <select
                    value={pageSize}
                    onChange={e => onPageSizeChange(Number(e.target.value))}
                    className={`py-1! bg-white cursor-pointer ${controlClass()}`}>
                    {PAGE_SIZES.map(size => (
                        <option
                            key={size}
                            value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </label>
            <span aria-live="polite">
                {first}–{last} of {total}
            </span>
            <div className="flex items-center gap-1">
                <PageButton
                    label="Previous page"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft className="w-5 h-5" />
                </PageButton>
                <PageButton
                    label="Next page"
                    disabled={page >= pageCount}
                    onClick={() => onPageChange(page + 1)}>
                    <ChevronRight className="w-5 h-5" />
                </PageButton>
            </div>
        </div>
    );
};

export default Pagination;
