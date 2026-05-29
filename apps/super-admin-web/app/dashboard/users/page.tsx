'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';

import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { useGetAllUsers } from '@/services/super-admin/users.api';

const PAGE_SIZE = 20;

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => {
      setDebouncedSearch(e.target.value);
      setPage(1);
    }, 400);
  }

  const { data, isLoading, isError, error } = useGetAllUsers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch,
  });

  const payload = data?.data;
  const users = payload?.users ?? [];
  const total = payload?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-foreground">
              RESQ
            </span>
            <span className="text-xl font-bold text-primary">.</span>
          </div>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground mt-1">
            All registered civilian users ({total} total)
          </p>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-6">
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  TOTAL USERS
                </span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {isLoading ? '—' : total}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  PAGE
                </span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {page} / {isLoading ? '—' : totalPages}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card className="rounded-xl">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <AlertTriangle className="h-6 w-6 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {error?.message ?? 'Failed to load users'}
                </p>
              </div>
            ) : users.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {debouncedSearch
                  ? 'No users match your search'
                  : 'No users found'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      {[
                        'Name',
                        'Email',
                        'Phone',
                        'Address',
                        'Role',
                        'Verified',
                        'Joined',
                      ].map(col => (
                        <th
                          key={col}
                          className="px-6 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr
                        key={u.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {u.phoneNumber}
                        </td>
                        <td className="max-w-[200px] truncate px-6 py-4 text-sm text-muted-foreground">
                          {u.primaryAddress}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                            {u.role ?? 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.isVerified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40 hover:bg-muted"
            >
              Previous
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40 hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
