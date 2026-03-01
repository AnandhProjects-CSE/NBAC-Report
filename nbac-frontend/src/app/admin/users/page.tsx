"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { usersApi } from "@/api/users.api"
import { DataTable } from "@/components/shared/DataTable"
import { RoleBadge } from "@/components/shared/RoleBadge"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/store/authStore"
import {
  Plus, Pencil, Trash2, Search, Loader2,
  UserCircle, Mail, Key, Shield, GraduationCap, Hash,
} from "lucide-react"
import { toast } from "sonner"
import { DEPARTMENTS, SECTIONS, YEARS } from "@/lib/utils"

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "faculty", "student"]),
  department: z.string().min(1, "Department is required"),
  year: z.number().optional(),
  section: z.string().optional(),
  rollNumber: z.string().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

// Base columns always shown
const baseColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            {row.getValue("name")?.toString()?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
          </span>
        </div>
        <span className="font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
  },
  {
    accessorKey: "department",
    header: "Department",
  },
]

// Student ID column — only injected when filtering by student role
const studentIdColumn: ColumnDef<User> = {
  id: "rollNumber",
  header: "Student ID",
  cell: ({ row }) => {
    const rollNumber = (row.original as any).rollNumber
    return rollNumber ? (
      <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
        {rollNumber}
      </span>
    ) : (
      <span className="text-amber-500 text-xs font-medium">Not set</span>
    )
  },
}

const statusColumn: ColumnDef<User> = {
  accessorKey: "isActive",
  header: "Status",
  cell: ({ row }) => (
    <Badge
      variant={row.getValue("isActive") ? "default" : "secondary"}
      className={
        row.getValue("isActive")
          ? "bg-emerald-500 hover:bg-emerald-500"
          : "bg-slate-400"
      }
    >
      {row.getValue("isActive") ? "Active" : "Inactive"}
    </Badge>
  ),
}

export default function UserManagementPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, roleFilter],
    queryFn: () =>
      usersApi.getAll({
        page,
        limit: 10,
        role: roleFilter === "all" ? undefined : (roleFilter as "admin" | "faculty" | "student"),
      }),
  })

  const createUserMutation = useMutation({
    mutationFn: (data: UserFormValues) => usersApi.create(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setSheetOpen(false)
      form.reset()
      toast.success("User created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create user")
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormValues> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setSheetOpen(false)
      setEditingUser(null)
      form.reset()
      toast.success("User updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update user")
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      toast.success("User deactivated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to deactivate user")
    },
  })

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
      department: "",
      year: undefined,
      section: "",
      rollNumber: "",
    },
  })

  const watchedRole = form.watch("role")

  // Build columns dynamically — Student ID column only shown when filtering by "student"
  const columns = useMemo<ColumnDef<User>[]>(() => {
    const actionsColumn: ColumnDef<User> = {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenSheet(row.original)}
            className="h-8 px-2"
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setUserToDelete(row.original)
              setDeleteDialogOpen(true)
            }}
            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      ),
    }

    return roleFilter === "student"
      ? [...baseColumns, studentIdColumn, statusColumn, actionsColumn]
      : [...baseColumns, statusColumn, actionsColumn]
  }, [roleFilter])

  const handleOpenSheet = (user?: User) => {
    if (user) {
      setEditingUser(user)
      form.reset({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        department: user.department,
        year: user.year,
        section: user.section,
        rollNumber: (user as any).rollNumber || "",
      })
    } else {
      setEditingUser(null)
      form.reset({
        name: "",
        email: "",
        password: "",
        role: "student",
        department: "",
        year: undefined,
        section: "",
        rollNumber: "",
      })
    }
    setSheetOpen(true)
  }

  const handleSubmit = (values: UserFormValues) => {
    if (!editingUser && values.role === "student" && !values.rollNumber?.trim()) {
      form.setError("rollNumber", { message: "Student ID is required for students" })
      return
    }

    if (editingUser) {
      const updateData: Partial<UserFormValues> = {
        name: values.name,
        email: values.email,
        department: values.department,
        year: values.year,
        section: values.section,
        rollNumber: values.rollNumber || undefined,
      }
      if (values.password) {
        updateData.password = values.password
      }
      updateUserMutation.mutate({ id: editingUser._id, data: updateData })
    } else {
      if (!values.password) {
        form.setError("password", { message: "Password is required for new users" })
        return
      }
      createUserMutation.mutate(values)
    }
  }

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete._id)
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="User Management"
        description="Manage users across your institution"
        actions={
          <Button
            onClick={() => handleOpenSheet()}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white dark:bg-slate-800"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student ID hint — only shown when filtering by student */}
      {roleFilter === "student" && (
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2">
          <Hash className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span>
            <strong>Student ID</strong> must match the <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">StudentID</code> column in your marks Excel upload.
            Students shown as <span className="text-amber-500 font-medium">Not set</span> cannot be matched during marks upload.
          </span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={{ pageIndex: page - 1, pageSize: 10 }}
        pageCount={data?.meta?.pagination?.totalPages || 1}
        onPageChange={(p) => setPage(p + 1)}
        emptyState={{
          title: "No users found",
          description: "Add your first user to get started",
        }}
      />

      {/* User Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <UserCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <SheetTitle className="text-left">
                    {editingUser ? "Edit User" : "Add New User"}
                  </SheetTitle>
                  <SheetDescription className="text-left mt-1">
                    {editingUser
                      ? "Update user information below"
                      : "Fill in the details to create a new user"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-slate-400" />
                    Personal Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter full name"
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="email"
                              placeholder="Enter email"
                              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Password{" "}
                          {editingUser && (
                            <span className="text-slate-400 font-normal">
                              (leave blank to keep current)
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="password"
                              placeholder="Enter password"
                              className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Role & Department */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-400" />
                    Role & Department
                  </h3>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-purple-500" />
                                Admin
                              </div>
                            </SelectItem>
                            <SelectItem value="faculty">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Faculty
                              </div>
                            </SelectItem>
                            <SelectItem value="student">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                Student
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Student-specific fields */}
                {watchedRole === "student" && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                        Student Details
                      </h3>

                      <FormField
                        control={form.control}
                        name="rollNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Student ID <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                  placeholder="e.g. CS2021001"
                                  className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono uppercase"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-xs">
                              Must match the <strong>StudentID</strong> column in your marks Excel upload.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <Select
                                onValueChange={(v) => field.onChange(parseInt(v))}
                                defaultValue={field.value?.toString()}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Select year" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {YEARS.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                      Year {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="section"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Section</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Select section" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SECTIONS.map((section) => (
                                    <SelectItem key={section} value={section}>
                                      Section {section}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                onClick={form.handleSubmit(handleSubmit)}
              >
                {(createUserMutation.isPending || updateUserMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Deactivate User"
        description={`Are you sure you want to deactivate ${userToDelete?.name}? They will no longer be able to access the system.`}
        confirmLabel="Deactivate"
        variant="danger"
        loading={deleteUserMutation.isPending}
      />
    </AppLayout>
  )
}