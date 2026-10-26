import { cn } from '@/lib/cn';

/**
 * Simple data table that scrolls sideways on small screens.
 * columns: [{ key, header, render?: (row) => node, className? }]
 */
export default function Table({ columns, rows, rowKey = 'id', emptyText, onRowClick, className }) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-gray-200 bg-white', className)}>
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('px-4 py-3 font-semibold text-gray-700', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer hover:bg-gray-50')}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 text-gray-800', column.className)}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
