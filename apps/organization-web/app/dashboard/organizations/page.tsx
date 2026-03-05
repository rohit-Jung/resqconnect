'use client';

import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Flame,
  Mail,
  MapPin,
  Phone,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IOrgListItem,
  useOrgList,
  useOrgProfile,
} from '@/services/organization/auth.api';
import { useOrgDashboardAnalytics } from '@/services/organization/dashboard.api';
import { ServiceCategory } from '@/types/auth.types';

// Get icon based on service category
function getServiceCategoryIcon(category: ServiceCategory) {
  switch (category) {
    case 'fire_truck':
      return <Flame className="h-6 w-6" />;
    case 'ambulance':
      return <Stethoscope className="h-6 w-6" />;
    case 'police':
      return <Shield className="h-6 w-6" />;
    case 'rescue_team':
      return <AlertTriangle className="h-6 w-6" />;
    default:
      return <Building2 className="h-6 w-6" />;
  }
}

// Get human-readable service category name
function getServiceCategoryName(category: ServiceCategory): string {
  switch (category) {
    case 'fire_truck':
      return 'Fire Department';
    case 'ambulance':
      return 'Ambulance Service';
    case 'police':
      return 'Police Service';
    case 'rescue_team':
      return 'Rescue Service';
    default:
      return category;
  }
}

// Get color classes based on service category
function getServiceCategoryColor(category: ServiceCategory): string {
  switch (category) {
    case 'fire_truck':
      return 'bg-orange-100 text-orange-600';
    case 'ambulance':
      return 'bg-red-100 text-red-600';
    case 'police':
      return 'bg-blue-100 text-blue-600';
    case 'rescue_team':
      return 'bg-yellow-100 text-yellow-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// Profile skeleton
function ProfileSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Organizations list skeleton
function OrgsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export default function OrganizationsPage() {
  const { data: profileResponse, isLoading: profileLoading } = useOrgProfile();
  const { data: analyticsResponse, isLoading: analyticsLoading } =
    useOrgDashboardAnalytics();
  const { data: orgsResponse, isLoading: orgsLoading } = useOrgList();

  const profile = profileResponse?.data?.data;
  const analytics = analyticsResponse?.data?.data;
  const organizations = orgsResponse?.data?.data ?? [];

  const isLoading = profileLoading || analyticsLoading;

  // Filter out current organization from the list
  const otherOrganizations = organizations.filter(
    org => org.id !== profile?.id
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
        <p className="text-muted-foreground mt-2">
          Your organization profile and network partners
        </p>
      </div>

      {/* Current Organization Profile */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Organization</h2>
        {isLoading ? (
          <ProfileSkeleton />
        ) : profile ? (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <div
                    className={`flex items-center justify-center rounded-lg p-3 ${getServiceCategoryColor(profile.serviceCategory)}`}
                  >
                    {getServiceCategoryIcon(profile.serviceCategory)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{profile.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getServiceCategoryName(profile.serviceCategory)}
                    </CardDescription>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  Active
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="text-sm font-medium">{profile.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Phone className="h-4 w-4" />
                    Contact Number
                  </p>
                  <p className="text-sm font-medium">
                    {profile.generalNumber || 'Not set'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4" />
                    Service Providers
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics?.providers.total ?? 0}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">
                    Emergency Requests
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics?.emergencyRequests.total ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Unable to load organization profile
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Network Organizations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Network Organizations
          <span className="text-muted-foreground text-sm font-normal ml-2">
            ({otherOrganizations.length} partners)
          </span>
        </h2>
        {orgsLoading ? (
          <OrgsListSkeleton />
        ) : otherOrganizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No other organizations in the network yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherOrganizations.map((org: IOrgListItem) => (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center rounded-lg p-2 ${getServiceCategoryColor(org.serviceCategory)}`}
                    >
                      {getServiceCategoryIcon(org.serviceCategory)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {org.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {getServiceCategoryName(org.serviceCategory)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    {org.email}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
