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

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useGetAllOrganizations();
  const deleteOrganization = useDeleteOrganization();
  const updateOrganization = useUpdateOrganization();

  const organizations = data?.data?.data ?? [];

  const filteredOrganizations = organizations.filter(
    (org: IOrganization) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOrgs = organizations.length;
  const verifiedOrgs = organizations.filter(
    (o: IOrganization) => o.isVerified
  ).length;
  const pendingOrgs = totalOrgs - verifiedOrgs;
  const ambulanceOrgs = organizations.filter(
    (o: IOrganization) => o.serviceCategory === 'ambulance'
  ).length;

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        <div className="max-w-md border border-primary bg-card p-6 text-center rounded-xl">
          <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-primary" />
          <h3 className="mb-2 font-semibold text-foreground">Failed to load</h3>
          <p className="text-sm text-muted-foreground">
            {error?.message || 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-foreground">
              RESQ
            </span>
            <span className="text-xl font-bold text-primary">.</span>
          </div>
          <Link href="/dashboard/organizations/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none gap-2">
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </Link>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Organizations
          </h1>
          <p className="text-muted-foreground mt-1">
            {organizations.length} total organizations
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Stats */}
        {!isLoading && (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'TOTAL ORGS', value: totalOrgs },
              { label: 'VERIFIED', value: verifiedOrgs },
              { label: 'PENDING', value: pendingOrgs },
              { label: 'AMBULANCE', value: ambulanceOrgs },
            ].map(stat => (
              <Card key={stat.label} className="rounded-xl">
                <CardContent className="p-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {stat.label}
                  </span>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 border-border focus:border-primary rounded-none"
          />
        </div>

        {/* Table */}
        <Card className="rounded-xl">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              All Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrganizations.length === 0 ? (
              <p className="text-muted-foreground py-12 text-center text-sm">
                {searchQuery
                  ? 'No organizations match your search'
                  : 'No organizations found'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                        Organization
                      </th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                        Email
                      </th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                        Category
                      </th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                        Status
                      </th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                        Joined
                      </th>
                      <th className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground px-6 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrganizations.map((org: IOrganization) => (
                      <tr
                        key={org.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className="px-6 py-4 font-medium text-foreground">
                          {org.name}
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm">
                          {org.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                            {serviceCategoryLabels[org.serviceCategory] ||
                              org.serviceCategory}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] ${
                              org.isVerified
                                ? 'text-green-600 dark:text-green-500'
                                : 'text-yellow-600 dark:text-yellow-500'
                            }`}
                          >
                            {org.isVerified ? (
                              <>
                                <CheckCircle className="h-3 w-3" /> Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" /> Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-6 py-4 text-sm">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-none"
                                disabled={deletingId === org.id}
                              >
                                {deletingId === org.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4 text-foreground" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/organizations/${org.id}`}
                                  className="text-foreground"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleVerification(org)}
                                className="text-foreground"
                              >
                                {org.isVerified ? (
                                  <>
                                    <XCircle className="mr-2 h-4 w-4" /> Revoke
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />{' '}
                                    Verify
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-primary"
                                onClick={() => handleDelete(org.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
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
    </div>
  );
}
