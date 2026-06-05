import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
  sortable?: boolean
  sortKey?: keyof T
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  searchKey?: keyof T | ((row: T) => string)
  filters?: {
    label: string
    key: keyof T
    options: { label: string; value: string }[]
  }[]
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = "Aucun résultat trouvé.",
  searchKey,
  filters = [],
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof T | null; direction: "asc" | "desc" }>({
    key: null,
    direction: "asc",
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // Filter
  const filteredData = React.useMemo(() => {
    let result = data

    // Apply search
    if (searchTerm && searchKey) {
      result = result.filter((item) => {
        const value = typeof searchKey === "function" ? searchKey(item) : item[searchKey]

        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase())
        }

        return false
      })
    }

    // Apply custom filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        result = result.filter((item) => String(item[key as keyof T]) === value)
      }
    })

    return result
  }, [data, searchTerm, searchKey, activeFilters])

  // Sort
  const sortedData = React.useMemo(() => {
    const sortableItems = [...filteredData]

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!]
        const bValue = b[sortConfig.key!]

        if (aValue === bValue) {
          return 0
        }

        if (sortConfig.direction === "asc") {
          return aValue < bValue ? -1 : 1
        }

        return aValue > bValue ? -1 : 1
      })
    }

    return sortableItems
  }, [filteredData, sortConfig])

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage

    return sortedData.slice(start, start + itemsPerPage)
  }, [sortedData, currentPage])

  const handleSort = (key: keyof T) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }

    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {searchKey && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-8 pr-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setCurrentPage(1)
                }}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {filters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <Select
                key={String(filter.key)}
                value={activeFilters[String(filter.key)] || "all"}
                onValueChange={(value) => {
                  setActiveFilters((prev) => ({
                    ...prev,
                    [String(filter.key)]: value,
                  }))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({filter.label})</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {Object.values(activeFilters).some((v) => v && v !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setActiveFilters({})
                  setCurrentPage(1)
                }}
                className="h-9 px-2 lg:px-3"
              >
                Réinitialiser
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={cn(column.className, column.sortable && "cursor-pointer select-none hover:text-foreground")}
                  onClick={() => column.sortable && column.sortKey && handleSort(column.sortKey)}
                >
                  <div className={cn("flex items-center gap-1",
                    column.className?.includes("text-right") && "flex-row-reverse",
                    column.className?.includes("text-center") && "justify-center"
                  )}>
                    {column.header}
                    {column.sortable && sortConfig.key === column.sortKey && (
                      <span className="text-xs">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {typeof column.accessor === "function"
                        ? column.accessor(row)
                        : (row[column.accessor] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((old) => Math.max(old - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((old) => Math.min(old + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
