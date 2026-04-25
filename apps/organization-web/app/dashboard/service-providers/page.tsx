'use client';

import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';

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

  const { data: providersData, isLoading } = useOrgServiceProviders();
  const deleteMutation = useOrgDeleteProvider();
  const verifyMutation = useOrgVerifyProvider();

  const responders = providersData?.data?.data || [];

  // Filter responders
  const filteredProviders = responders.filter(responder => {
    const matchesSearch =
      responder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      responder.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      responder.phoneNumber.toString().includes(searchQuery);
    const matchesStatus =
      filterStatus === 'all' || responder.serviceStatus === filterStatus;
    const matchesType =
      filterType === 'all' || responder.serviceType === filterType;
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
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin dark:text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Swiss Style Header */}
      <div className="bg-background dark:bg-background px-6 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-foreground dark:text-foreground">
              RESQ
            </span>
            <span className="text-xl font-bold text-primary dark:text-primary">
              .
            </span>
          </div>
          <Link href="/dashboard/service-providers/new">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none gap-2">
              <Plus className="h-4 w-4" />
              Add Responder
            </Button>
          </Link>
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary dark:bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
            Responders
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Manage your organization&apos;s responders
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  Total Responders
                </p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">
                  {responders.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  Available
                </p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">
                  {
                    responders.filter(p => p.serviceStatus === 'available')
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/30 p-2">
                <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  On Assignment
                </p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">
                  {
                    responders.filter(p => p.serviceStatus === 'assigned')
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <XCircle className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm dark:text-muted-foreground">
                  Off Duty
                </p>
                <p className="text-2xl font-bold text-foreground dark:text-foreground">
                  {
                    responders.filter(p => p.serviceStatus === 'off_duty')
                      .length
                  }
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
              className="pl-10 border-border focus:border-primary rounded-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-card rounded-none border-border px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="assigned">On Assignment</option>
            <option value="off_duty">Off Duty</option>
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-card rounded-none border-border px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All Types</option>
            <option value="ambulance">Ambulance</option>
            <option value="fire_truck">Fire Truck</option>
            <option value="police">Police</option>
            <option value="rescue_team">Rescue Team</option>
          </select>
        </div>

        {/* Responders List */}
        <div className="bg-card overflow-hidden rounded-xl border">
          {filteredProviders.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-medium text-foreground">
                No responders found
              </h3>
              <p className="text-muted-foreground mb-4 dark:text-muted-foreground">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first responder'}
              </p>
              {!searchQuery &&
                filterStatus === 'all' &&
                filterType === 'all' && (
                  <Link href="/dashboard/service-providers/new">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Responder
                    </Button>
                  </Link>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Responder
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Service Type
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Verified
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProviders.map(responder => {
                    const typeConfig =
                      SERVICE_TYPE_CONFIG[responder.serviceType];
                    const statusConfig = STATUS_CONFIG[responder.serviceStatus];

                    return (
                      <tr key={responder.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center">
                              <span className="text-primary font-medium">
                                {responder.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {responder.name}
                              </p>
                              <p className="text-muted-foreground flex items-center gap-1 text-sm dark:text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {responder.primaryAddress}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1 text-sm text-foreground">
                              <Mail className="text-muted-foreground h-3 w-3 dark:text-muted-foreground" />
                              {responder.email}
                            </p>
                            <p className="flex items-center gap-1 text-sm text-foreground">
                              <Phone className="text-muted-foreground h-3 w-3 dark:text-muted-foreground" />
                              {responder.phoneNumber}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center gap-2 ${typeConfig.color}`}
                          >
                            {typeConfig.icon}
                            <span className="text-sm font-medium text-foreground">
                              {typeConfig.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={`${statusConfig.bgColor} ${statusConfig.color} rounded-none border-0`}
                          >
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {responder.isVerified ? (
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
                              className="rounded-none"
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown === responder.id
                                    ? null
                                    : responder.id
                                )
                              }
                            >
                              <MoreVertical className="h-4 w-4 text-foreground" />
                            </Button>
                            {activeDropdown === responder.id && (
                              <div className="bg-popover absolute right-0 z-10 mt-1 w-48 rounded-lg border shadow-lg">
                                <Link
                                  href={`/dashboard/service-providers/${responder.id}`}
                                  className="hover:bg-muted flex items-center gap-2 px-4 py-2 text-sm text-foreground"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Link>
                                <Link
                                  href={`/dashboard/service-providers/${responder.id}/edit`}
                                  className="hover:bg-muted flex items-center gap-2 px-4 py-2 text-sm text-foreground"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </Link>
                                {!responder.isVerified && (
                                  <button
                                    onClick={() => handleVerify(responder.id)}
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
                                  onClick={() => handleDelete(responder.id)}
                                  className="hover:bg-muted flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {deleteId === responder.id
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
    </div>
  );
}
