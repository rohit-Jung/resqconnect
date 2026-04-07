'use client';

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Search,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDashboardAnalytics } from '@/services/super-admin/dashboard.api';
import { IDashboardEntity } from '@/types/auth.types';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState<'createdAt' | 'name' | 'email'>(
    'createdAt'
  );
  const [sortBy, setSortBy] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, isError, error } = useDashboardAnalytics({
    page,
    limit,
    sortBy,
    sortField,
  });

  const analytics = data?.data?.data;
  const users = analytics?.users?.info ?? [];
  const totalUsers = analytics?.users?.total ?? 0;
  const thisMonthUsers = analytics?.users?.thisMonth ?? 0;
  const lastMonthUsers = analytics?.users?.lastMonth ?? 0;

  const totalPages = Math.ceil(totalUsers / limit);

  // Filter users by search query (client-side filter since backend doesn't support search)
  const filteredUsers = users.filter(
    (user: IDashboardEntity) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate growth percentage
  const growthPercentage =
    lastMonthUsers > 0
      ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
      : thisMonthUsers > 0
        ? 100
        : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-red-600 dark:text-red-400" />
          <h3 className="mb-2 font-semibold text-red-800 dark:text-red-200">
            Failed to load users
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message || 'An error occurred while fetching users'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-2">
            Manage all registered users ({totalUsers} total)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                TOTAL USERS
              </span>
              <Users className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{totalUsers}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                THIS MONTH
              </span>
              <Users className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {thisMonthUsers}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              New users this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                GROWTH
              </span>
              <Users className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p
              className={`text-3xl font-bold tracking-tight ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {growthPercentage >= 0 ? '+' : ''}
              {growthPercentage}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              vs last month ({lastMonthUsers} users)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={sortField}
            onValueChange={v =>
              setSortField(v as 'createdAt' | 'name' | 'email')
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Joined</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={v => setSortBy(v as 'asc' | 'desc')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest</SelectItem>
              <SelectItem value="asc">Oldest</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(limit)}
            onValueChange={v => {
              setLimit(Number(v));
              setPage(1); // Reset to first page when changing limit
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-base font-semibold">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {searchQuery ? 'No users match your search' : 'No users found'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                      User
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                      Email
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(
                    (user: IDashboardEntity, index: number) => (
                      <tr
                        key={`${user.email}-${index}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center">
                              <span className="text-primary text-sm font-medium">
                                {user.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                        </td>
                        <td className="text-muted-foreground px-6 py-4">
                          {new Date(user.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {(page - 1) * limit + 1} to{' '}
                {Math.min(page * limit, totalUsers)} of {totalUsers} users
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-muted-foreground px-2 text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
