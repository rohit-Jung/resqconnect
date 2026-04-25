'use client';

import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';

import { AlertTriangle, Loader2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  useDeleteOrganization,
  useGetAllOrganizations,
  useUpdateOrganization,
} from '@/services/super-admin/organizations.api';

import { OrganizationsTable } from './_components/organizations-table';
import { StatsCards } from './_components/stats-cards';

type CpOrg = {
  id: string;
  name: string;
  sector: 'hospital' | 'police' | 'fire';
  status: 'pending_approval' | 'active' | 'suspended' | 'trial_expired';
  siloBaseUrl: string;
  createdAt: string;
};

export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useGetAllOrganizations();
  const deleteOrganization = useDeleteOrganization();
  const updateOrganization = useUpdateOrganization();

  const organizations = data?.data?.orgs ?? [];

  const filteredOrganizations = organizations.filter((org: CpOrg) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(
    (o: CpOrg) => o.status === 'active'
  ).length;
  const pendingOrgs = organizations.filter(
    (o: CpOrg) => o.status === 'pending_approval'
  ).length;
  const hospitalOrgs = organizations.filter(
    (o: CpOrg) => o.sector === 'hospital'
  ).length;

  const handleDelete = async (id: string) => {
    if (deletingId) return false;
    setDeletingId(id);
    try {
      await deleteOrganization.mutateAsync(id);
      toast.success('Organization deleted');
      return true;
    } catch (err) {
      console.error('Failed to delete organization:', err);
      toast.error('Failed to delete organization');
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleVerification = async (org: {
    id: CpOrg['id'];
    status: CpOrg['status'];
  }) => {
    try {
      await updateOrganization.mutateAsync({
        id: org.id,
        data: {
          status: org.status === 'active' ? 'suspended' : 'active',
        },
      });
      toast.success('Organization status updated');
    } catch (err) {
      console.error('Failed to update organization:', err);
      toast.error('Failed to update organization');
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
        <StatsCards
          stats={[
            { label: 'TOTAL ORGS', value: totalOrgs },
            { label: 'ACTIVE', value: activeOrgs },
            { label: 'PENDING', value: pendingOrgs },
            { label: 'HOSPITAL', value: hospitalOrgs },
          ]}
        />

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

        <OrganizationsTable
          organizations={filteredOrganizations}
          searchQuery={searchQuery}
          deletingId={deletingId}
          onToggleVerification={handleToggleVerification}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
