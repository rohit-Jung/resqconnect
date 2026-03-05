'use client';

import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  useDeleteOrganization,
  useGetAllOrganizations,
  useUpdateOrganization,
} from '@/services/super-admin/organizations.api';
import { IOrganization } from '@/types/auth.types';

const serviceCategoryLabels: Record<string, string> = {
  ambulance: 'Ambulance',
  police: 'Police',
  fire_brigade: 'Fire Brigade',
};

const serviceCategoryColors: Record<string, string> = {
  ambulance: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  police: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  fire_brigade:
    'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
};

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useGetAllOrganizations();
  const deleteOrganization = useDeleteOrganization();
  const updateOrganization = useUpdateOrganization();

  const organizations = data?.data?.data ?? [];

  // Filter organizations by search query
  const filteredOrganizations = organizations.filter(
    (org: IOrganization) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this organization?')) {
      setDeletingId(id);
      try {
        await deleteOrganization.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete organization:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleToggleVerification = async (org: IOrganization) => {
    try {
      await updateOrganization.mutateAsync({
        id: org.id,
        data: { isVerified: !org.isVerified },
      });
    } catch (err) {
      console.error('Failed to update organization:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading organizations...
          </p>
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
            Failed to load organizations
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">
            {error?.message || 'An error occurred while fetching organizations'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground mt-2">
            Manage all registered organizations ({organizations.length} total)
          </p>
        </div>
        <Link href="/dashboard/organizations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrganizations.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {searchQuery
                ? 'No organizations match your search'
                : 'No organizations found'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Organization
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Email
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Category
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Status
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Joined
                    </th>
                    <th className="text-muted-foreground pb-3 text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizations.map((org: IOrganization) => (
                    <tr key={org.id} className="border-b last:border-0">
                      <td className="py-4 font-medium">{org.name}</td>
                      <td className="text-muted-foreground py-4">
                        {org.email}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            serviceCategoryColors[org.serviceCategory] ||
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {serviceCategoryLabels[org.serviceCategory] ||
                            org.serviceCategory}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            org.isVerified
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                          }`}
                        >
                          {org.isVerified ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td className="text-muted-foreground py-4">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === org.id}
                            >
                              {deletingId === org.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/organizations/${org.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleVerification(org)}
                            >
                              {org.isVerified ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Revoke Verification
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify Organization
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleDelete(org.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
