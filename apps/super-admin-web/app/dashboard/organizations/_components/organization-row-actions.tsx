'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';

import {
  CheckCircle,
  Eye,
  Loader2,
  MoreHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export type OrganizationRowActionsOrg = {
  id: string;
  status: 'pending_approval' | 'active' | 'suspended' | 'trial_expired';
};

export function OrganizationRowActions({
  org,
  deleting,
  onToggleVerification,
  onDelete,
}: {
  org: OrganizationRowActionsOrg;
  deleting: boolean;
  onToggleVerification: () => void | Promise<void>;
  onDelete: () => Promise<boolean>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openConfirm = () => {
    // close the dropdown first; opening the dialog in the next tick avoids
    // focus/cleanup race conditions when the menu content unmounts.
    setMenuOpen(false);
    setTimeout(() => setConfirmOpen(true), 0);
  };

  const handleConfirmDelete = async () => {
    const ok = await onDelete();
    if (ok) setConfirmOpen(false);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4 text-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="p-2">
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/organizations/${org.id}`}
              className="text-foreground hover:cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={onToggleVerification}
            className="text-foreground cursor-pointer"
          >
            {org.status === 'active' ? (
              <>
                <XCircle className="mr-2 h-4 w-4" /> Revoke
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Verify
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onSelect={e => {
              // Keep the interaction from being swallowed by the menu close/unmount.
              e.preventDefault();
              openConfirm();
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the organization from the control plane registry.
              Silo data is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" className="rounded-none">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild onClick={handleConfirmDelete}>
              <Button
                variant="destructive"
                className="rounded-none"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
