'use client';

import {
  Ambulance,
  CheckCircle,
  Edit,
  Eye,
  Flame,
  LifeBuoy,
  Loader2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useOrgDeleteProvider,
  useOrgServiceProviders,
  useOrgVerifyProvider,
} from '@/services/service-provider/auth.api';
import { ServiceStatus, ServiceType } from '@/types/auth.types';

const SERVICE_TYPE_CONFIG: Record<
  ServiceType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  ambulance: {
    label: 'Ambulance',
    icon: <Ambulance className="h-4 w-4" />,
    color: 'text-red-500',
  },
  fire_truck: {
    label: 'Fire Truck',
    icon: <Flame className="h-4 w-4" />,
    color: 'text-orange-500',
  },
  police: {
    label: 'Police',
    icon: <Shield className="h-4 w-4" />,
    color: 'text-blue-500',
  },
  rescue_team: {
    label: 'Rescue Team',
    icon: <LifeBuoy className="h-4 w-4" />,
    color: 'text-green-500',
  },
};

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; color: string; bgColor: string }
> = {
  available: {
    label: 'Available',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  assigned: {
    label: 'On Assignment',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  off_duty: {
    label: 'Off Duty',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
};

export default function ServiceProvidersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const { data: providersData, isLoading, refetch } = useOrgServiceProviders();
  const deleteMutation = useOrgDeleteProvider();
  const verifyMutation = useOrgVerifyProvider();

  const providers = providersData?.data?.data || [];

  // Filter providers
  const filteredProviders = providers.filter(provider => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.phoneNumber.toString().includes(searchQuery);
    const matchesStatus =
      filterStatus === 'all' || provider.serviceStatus === filterStatus;
    const matchesType =
      filterType === 'all' || provider.serviceType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (deleteId === id) {
      await deleteMutation.mutateAsync(id);
      setDeleteId(null);
    } else {
      setDeleteId(id);
    }
  };

  const handleVerify = async (id: string) => {
    await verifyMutation.mutateAsync(id);
    setActiveDropdown(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Providers</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s service providers
          </p>
        </div>
        <Link href="/dashboard/service-providers/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Providers</p>
              <p className="text-2xl font-bold">{providers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Available</p>
              <p className="text-2xl font-bold">
                {providers.filter(p => p.serviceStatus === 'available').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <Loader2 className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">On Assignment</p>
              <p className="text-2xl font-bold">
                {providers.filter(p => p.serviceStatus === 'assigned').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <XCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Off Duty</p>
              <p className="text-2xl font-bold">
                {providers.filter(p => p.serviceStatus === 'off_duty').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="assigned">On Assignment</option>
          <option value="off_duty">Off Duty</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-background rounded-md border px-3 py-2 text-sm"
        >
          <option value="all">All Types</option>
          <option value="ambulance">Ambulance</option>
          <option value="fire_truck">Fire Truck</option>
          <option value="police">Police</option>
          <option value="rescue_team">Rescue Team</option>
        </select>
      </div>

      {/* Providers List */}
      <div className="bg-card overflow-hidden rounded-xl border">
        {filteredProviders.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">
              No service providers found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first service provider'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterType === 'all' && (
              <Link href="/dashboard/service-providers/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Provider
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Service Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Verified
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProviders.map(provider => {
                  const typeConfig = SERVICE_TYPE_CONFIG[provider.serviceType];
                  const statusConfig = STATUS_CONFIG[provider.serviceStatus];

                  return (
                    <tr key={provider.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                            <span className="text-primary font-medium">
                              {provider.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-muted-foreground flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {provider.primaryAddress}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-sm">
                            <Mail className="text-muted-foreground h-3 w-3" />
                            {provider.email}
                          </p>
                          <p className="flex items-center gap-1 text-sm">
                            <Phone className="text-muted-foreground h-3 w-3" />
                            {provider.phoneNumber}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={`flex items-center gap-2 ${typeConfig.color}`}
                        >
                          {typeConfig.icon}
                          <span className="text-sm font-medium">
                            {typeConfig.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={`${statusConfig.bgColor} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {provider.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-yellow-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === provider.id
                                  ? null
                                  : provider.id
                              )
                            }
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {activeDropdown === provider.id && (
                            <div className="bg-card absolute right-0 z-10 mt-1 w-48 rounded-lg border shadow-lg">
                              <Link
                                href={`/dashboard/service-providers/${provider.id}`}
                                className="hover:bg-muted flex items-center gap-2 px-4 py-2 text-sm"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                              <Link
                                href={`/dashboard/service-providers/${provider.id}/edit`}
                                className="hover:bg-muted flex items-center gap-2 px-4 py-2 text-sm"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </Link>
                              {!provider.isVerified && (
                                <button
                                  onClick={() => handleVerify(provider.id)}
                                  className="hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-green-600"
                                  disabled={verifyMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  {verifyMutation.isPending
                                    ? 'Verifying...'
                                    : 'Verify'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(provider.id)}
                                className="hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                {deleteId === provider.id
                                  ? 'Confirm Delete'
                                  : 'Delete'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
