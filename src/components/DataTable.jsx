import React, { useMemo, useState } from 'react';
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
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, PanelRight } from 'lucide-react';

const DataTable = ({
  expandRow,
  setExpand,
  expand,
  onRowExpand,
  data,
  columns,
  searchPlaceholder = 'Search...',
  pageSizeOptions = [5, 10, 20, 30, 40, 50],
  initialPageSize = 10,
  disableSorting = false,
  renderSubComponent,
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const processedColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        id: column.id || column.accessorKey || String(column.header),
        enableSorting: disableSorting ? false : column.disableSorting !== true,
      })),
    [columns, disableSorting]
  );

  const table = useReactTable({
    data: data || [],
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
    enableSorting: !disableSorting,
  });

  const handleRowExpand = (row) => {
    const isExpanded = row.getIsExpanded();
    row.toggleExpanded();

    // If expandRow is true and setExpand is provided, update the expand state
    if (expandRow && setExpand) {
      setExpand(true);
      // If onRowExpand callback is provided, call it with row data
      if (onRowExpand && !isExpanded) {
        onRowExpand(row.original);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-max">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 bg-card text-foreground border-border"
          />
        </div>
        <Select
          value={pagination.pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="w-[130px] border-border">
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
      <div className="rounded-md border border-border bg-card">
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
                        className="hover:bg-accent hover:text-accent-foreground"
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
            {/* Safely check if rows exist before accessing length */}
            {table.getRowModel() && table.getRowModel().rows && table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow className="group hover:bg-muted">
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <TableCell key={cell.id} className="text-foreground relative">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}

                        {expandRow && cellIndex === 0 && (
                          <div className="absolute top-2 left-2 sm:left-4 md:left-8 lg:left-12 xl:left-28 group-hover:block hidden z-10">
                            <button
                              className="inline-flex items-center border rounded text-xs py-1 px-2 hover:bg-primary-foreground bg-background shadow-sm"
                              onClick={() => handleRowExpand(row)}
                            >
                              <PanelRight className="w-4 h-4 mr-1" />
                              Expand
                            </button>
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {row.getIsExpanded() && renderSubComponent ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>{renderSubComponent({ row })}</TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between mt-4 flex-wrap gap-4 md:gap-0">
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
              let startPage = Math.max(0, pageIndex - 2);
              let endPage = Math.min(pageCount - 1, startPage + 4);
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
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          Page {pagination.pageIndex + 1} of {table.getPageCount()} | {table.getFilteredRowModel().rows.length} total
          rows
        </div>
      </div>
    </div>
  );
};

export default DataTable;
