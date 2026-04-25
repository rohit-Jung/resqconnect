'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';

import { CheckCircle, XCircle } from 'lucide-react';

import {
  OrganizationRowActions,
  type OrganizationRowActionsOrg,
} from './organization-row-actions';

export type OrganizationsTableOrg = OrganizationRowActionsOrg & {
  name: string;
  sector: 'hospital' | 'police' | 'fire';
  createdAt: string;
};

const sectorLabels: Record<string, string> = {
  hospital: 'Hospital',
  police: 'Police',
  fire: 'Fire',
};

export function OrganizationsTable({
  organizations,
  searchQuery,
  deletingId,
  onToggleVerification,
  onDelete,
}: {
  organizations: OrganizationsTableOrg[];
  searchQuery: string;
  deletingId: string | null;
  onToggleVerification: (org: OrganizationsTableOrg) => void | Promise<void>;
  onDelete: (orgId: string) => Promise<boolean>;
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          All Organizations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {organizations.length === 0 ? (
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
                    Sector
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
                {organizations.map(org => (
                  <tr
                    key={org.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {org.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                        {sectorLabels[org.sector] || org.sector}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.1em] ${
                          org.status === 'active'
                            ? 'text-green-600 dark:text-green-500'
                            : 'text-yellow-600 dark:text-yellow-500'
                        }`}
                      >
                        {org.status === 'active' ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Verified
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> {org.status}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-6 py-4 text-sm">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <OrganizationRowActions
                        org={org}
                        deleting={deletingId === org.id}
                        onToggleVerification={() => onToggleVerification(org)}
                        onDelete={() => onDelete(org.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
