"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import { useState } from "react"
import { ChevronsUpDown, ArrowUp, ArrowDown } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type ExtendedColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  subHeader?: string
  headerColor?: string
  width?: number | string
}

interface DataTableProps<TData, TValue> {
  columns: ExtendedColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead 
                    key={header.id}
                    style={{
                      width: (header.column.columnDef as ExtendedColumnDef<TData, TValue>).width
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center gap-2"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          color: (header.column.columnDef as ExtendedColumnDef<TData, TValue>).headerColor
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-white/0" style={{backgroundColor: 'transparent'}}>
                            <ArrowUp className="h-4 w-4 text-white" />
                          </span>
                        ) : header.column.getIsSorted() === "desc" ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-white/0" style={{backgroundColor: 'transparent'}}>
                            <ArrowDown className="h-4 w-4 text-white" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-full bg-light-gray/[0.04]">
                            <ChevronsUpDown className="h-4 w-4 text-[#C7CBD7]" />
                          </span>
                        )}
                        {(header.column.columnDef as ExtendedColumnDef<TData, TValue>).subHeader && (
                          <span className="text-sm text-gray-400 ml-2">
                            {(header.column.columnDef as ExtendedColumnDef<TData, TValue>).subHeader}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id}
                    style={{
                      width: (cell.column.columnDef as ExtendedColumnDef<TData, TValue>).width
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 