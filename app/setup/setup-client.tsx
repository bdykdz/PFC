'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserPlus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface AzureUser {
  id: string
  email: string
  name: string
  jobTitle?: string
  department?: string
}

interface SetupClientProps {
  initialSetupComplete: boolean
}

export default function SetupClient({ initialSetupComplete }: SetupClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [azureUsers, setAzureUsers] = useState<AzureUser[]>([])
  const [setupComplete, setSetupComplete] = useState(initialSetupComplete)
  
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = useState('')

  const fetchAzureUsers = async () => {
    setIsFetching(true)
    try {
      const response = await fetch('/api/setup/fetch-azure-users', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch users from Azure AD')
      }
      
      const data = await response.json()
      console.log('Frontend received:', data.users.length, 'users')
      setAzureUsers(data.users)
      // Don't auto-select users
      setRowSelection({})
      toast.success(`Fetched ${data.users.length} users from Azure AD`)
    } catch (error) {
      toast.error('Failed to fetch users from Azure AD')
      console.error('Error fetching Azure users:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const columns: ColumnDef<AzureUser>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'jobTitle',
      header: 'Job Title',
      cell: ({ row }) => row.getValue('jobTitle') || '-',
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => row.getValue('department') || '-',
    },
    {
      id: 'access',
      header: 'Access Level',
      cell: ({ row }) => {
        const isSelected = row.getIsSelected()
        return (
          <Badge variant={isSelected ? 'default' : 'secondary'}>
            {isSelected ? 'Login + Search' : 'Search Only'}
          </Badge>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data: azureUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    getRowId: (row) => row.id, // Use the user's ID as the row ID
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20, // Show more users per page
      },
    },
  })

  const selectedUserIds = Object.keys(rowSelection).filter(key => rowSelection[key])

  const proceedToAdminSelection = () => {
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user to import')
      return
    }

    // Get selected user objects
    const selectedUsers = azureUsers.filter(u => selectedUserIds.includes(u.id))
    
    // Store in sessionStorage for the next page
    sessionStorage.setItem('selectedUsers', JSON.stringify(selectedUsers))
    sessionStorage.setItem('allAzureUsers', JSON.stringify(azureUsers))
    
    // Navigate to admin selection page
    router.push('/setup/admin')
  }

  if (setupComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Setup Complete</CardTitle>
            <CardDescription>
              The application has already been configured.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Application
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">People Finder Setup</h1>
          <p className="text-muted-foreground mt-2">
            Import Azure AD users to create employee profiles and select who can login
          </p>
        </div>

        {azureUsers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Import Users from Azure AD</CardTitle>
              <CardDescription>
                Fetch all users from Azure AD. They will become searchable employee profiles,
                and you can select which ones should have login access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fetchAzureUsers} 
                disabled={isFetching}
                className="w-full"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching users...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Fetch Users from Azure AD
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How this works:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• <strong>All {azureUsers.length} users</strong> will be imported as searchable employee profiles</li>
                <li>• <strong>Selected users only</strong> will be able to login to the application</li>
                <li>• You must select at least one user to be the administrator</li>
              </ul>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Select Users with Login Access</CardTitle>
                <CardDescription>
                  Choose which employees can login to the application ({selectedUserIds.length} selected)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, email, or department..."
                      value={globalFilter}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              return (
                                <TableHead key={header.id}>
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
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
                                <TableCell key={cell.id}>
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

                  {/* Pagination */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected
                        {azureUsers.length > 0 && ` • Total: ${azureUsers.length} users`}
                      </div>
                      <Select
                        value={table.getState().pagination.pageSize.toString()}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                      >
                        <SelectTrigger className="h-8 w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={pageSize.toString()}>
                              {pageSize} rows
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Section */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Import Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Total Employee Profiles:</div>
                    <div className="text-2xl font-bold">{azureUsers.length}</div>
                    <div className="text-xs text-muted-foreground">All users will be searchable</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Users with Login Access:</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedUserIds.length}</div>
                    <div className="text-xs text-muted-foreground">Can login and use the app</div>
                  </div>
                </div>
                {selectedUserIds.length === 0 && (
                  <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded-md">
                    <p className="text-sm text-amber-800">
                      ⚠️ You must select at least one user to have login access
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAzureUsers([])
                  setRowSelection({})
                  sessionStorage.removeItem('selectedUsers')
                  sessionStorage.removeItem('allAzureUsers')
                }}
              >
                Start Over
              </Button>
              <Button
                onClick={proceedToAdminSelection}
                disabled={selectedUserIds.length === 0}
                size="lg"
              >
                Continue to Admin Selection
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}