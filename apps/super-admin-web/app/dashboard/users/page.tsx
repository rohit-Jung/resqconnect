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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-muted-foreground text-xs">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthUsers}</div>
            <p className="text-muted-foreground text-xs">
              New users this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {growthPercentage >= 0 ? '+' : ''}
              {growthPercentage}%
            </div>
            <p className="text-muted-foreground text-xs">
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
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
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      User
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Email
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
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
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
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
                        <td className="py-4">
                          <div className="text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                        </td>
                        <td className="text-muted-foreground py-4">
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
