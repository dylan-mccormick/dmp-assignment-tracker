// KeyValueTable.tsx
// Lists labelled values: keys on the left, values on the right, one row each

import type { ReactNode } from "react";

export interface KeyValueRow {
    label: string;
    value: ReactNode;
}

interface KeyValueTableProps {
    rows: KeyValueRow[];
}

const KeyValueTable = ({ rows }: KeyValueTableProps) => {
    return (
        <dl className="w-full divide-y divide-gray-200 border-y border-gray-200">
            {rows.map(({ label, value }) => (
                <div
                    key={label}
                    className="flex justify-between gap-4 py-3">
                    <dt className="shrink-0 text-gray-600">{label}</dt>
                    <dd className="min-w-0 text-right break-words">{value}</dd>
                </div>
            ))}
        </dl>
    );
};

export default KeyValueTable;
