import React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const DataTable = ({
  data,
  columns,
  searchPlaceholder = 'Search...',
  pageSizeOptions = [5, 10, 20, 30, 40, 50],
  initialPageSize = 10,
  disableSorting = false,
}) => {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Ensure all columns have an ID
  const processedColumns = React.useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        // Ensure every column has an id
        id: column.id || column.accessorKey || String(column.header),
        enableSorting: disableSorting ? false : column.disableSorting !== true,
      })),
    [columns, disableSorting]
  );

  const table = useReactTable({
    data,
    columns: processedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
    },
    enableRowSelection: true,
    enableSorting: !disableSorting,
  });

  return (
    <div className="w-full">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-max">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 bg-white dark:bg-slate-900"
          />
        </div>

        <Select
          value={pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} rows
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <Button
                        variant="ghost"
                        onClick={() => header.column.toggleSorting(header.column.getIsSorted() === 'asc')}
                        className="hover:bg-zinc-100 dark:hover:bg-slate-800"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? (
                          <ChevronUp className="ml-2 h-4 w-4" />
                        ) : header.column.getIsSorted() === 'desc' ? (
                          <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                          <ChevronsUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={processedColumns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
              const pageIndex = pagination.pageIndex;
              const pageCount = table.getPageCount();
              // Show pages around the current page
              let startPage = Math.max(0, pageIndex - 2);
              let endPage = Math.min(pageCount - 1, startPage + 4);

              // Adjust if we're near the end
              if (endPage - startPage < 4) {
                startPage = Math.max(0, endPage - 4);
              }

              const currentPageIndex = startPage + i;
              if (currentPageIndex >= pageCount) return null;

              return (
                <Button
                  key={currentPageIndex}
                  variant={pagination.pageIndex === currentPageIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => table.setPageIndex(currentPageIndex)}
                >
                  {currentPageIndex + 1}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
          Page {pagination.pageIndex + 1} of {table.getPageCount()} | {table.getFilteredRowModel().rows.length} total
          rows
        </div>
      </div>
    </div>
  );
};

export default DataTable;
