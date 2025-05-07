// src/components/trade/TradeHistoryTable.tsx
"use client";

import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  PlusCircle,
  History as HistoryIcon, // Renamed to avoid conflict with navigation history
} from "lucide-react";
import { useTrades } from "@/contexts/TradeContext";
import type { Trade, TradeWithProfit } from "@/types";
import { calculateProfitLoss, formatCurrency, formatDate } from "@/lib/trade-utils";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const columnHelper = createColumnHelper<TradeWithProfit>();

export function TradeHistoryTable() {
  const { trades, deleteTrade, isLoading } = useTrades();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const data = useMemo(() => {
    if (isLoading) return [];
    return trades.map(trade => ({
      ...trade,
      profitOrLoss: calculateProfitLoss(trade),
    })).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()); // Default sort by most recent entry date
  }, [trades, isLoading]);

  const columns = useMemo<ColumnDef<TradeWithProfit, any>[]>(() => [
    columnHelper.accessor("entryDate", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 sm:px-2"
        >
          Entry Date
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: (info) => formatDate(info.getValue()),
      sortingFn: 'datetime',
    }),
    columnHelper.accessor("stockSymbol", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 sm:px-2"
        >
          Symbol
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: (info) => info.getValue(),
    }),
     columnHelper.accessor("tradeType", {
      header: "Type",
      cell: (info) => {
        const type = info.getValue();
        return type === 'buy' ? (
          <span className="inline-flex items-center text-green-600">
            <TrendingUp className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Long</span>
          </span>
        ) : (
          <span className="inline-flex items-center text-red-600">
            <TrendingDown className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Short</span>
          </span>
        );
      },
    }),
    columnHelper.accessor("quantity", {
      header: "Qty", // Shorter header for mobile
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("entryPrice", {
      header: "Entry", // Shorter header
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor("exitPrice", {
      header: "Exit", // Shorter header
      cell: (info) => info.getValue() ? formatCurrency(info.getValue()) : <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-auto" />,
    }),
    columnHelper.accessor("profitOrLoss", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 sm:px-2"
        >
          P/L
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: (info) => {
        const profit = info.getValue();
        if (profit === null || profit === undefined) return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-auto" />;
        const profitColor = profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-foreground";
        return <span className={profitColor}>{formatCurrency(profit)}</span>;
      },
      sortingFn: 'alphanumeric', 
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const trade = row.original;
        return (
          <div className="flex space-x-1 sm:space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => router.push(`/edit-trade/${trade.id}`)}
              aria-label="Edit trade"
            >
              <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </Button>
            <AlertDialog open={showDeleteConfirm === trade.id} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => setShowDeleteConfirm(trade.id)} aria-label="Delete trade">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the trade for {trade.stockSymbol}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (trade.id) deleteTrade(trade.id);
                      setShowDeleteConfirm(null);
                    }}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    }),
  ], [router, deleteTrade, showDeleteConfirm]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Trade History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0) {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Trade History</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 sm:py-12">
          <HistoryIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No Trades Yet</h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">Start by adding your first trade to see your history.</p>
          <Button size="sm" className="sm:text-base sm:px-4 sm:h-10" onClick={() => router.push('/add-trade')}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Trade
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
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
                      <TableCell key={cell.id} className="whitespace-nowrap px-2 py-2 text-xs sm:text-sm sm:px-4 sm:py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
