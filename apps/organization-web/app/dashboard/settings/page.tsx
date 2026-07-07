'use client';

import { Button } from '@repo/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';

import { ImageIcon, Loader2, Lock, Save, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';

import {
  useOrgProfile,
  useOrgUpdateProfile,
} from '@/services/organization/auth.api';
import {
  useDeleteOrgLogo,
  useUpdateOrgLogo,
} from '@/services/organization/upload.api';
import { IOrgProfileResponse } from '@/types/auth.types';

export default function SettingsPage() {
  const { data: profileData, isLoading } = useOrgProfile();
  const updateProfileMutation = useOrgUpdateProfile();

  const profileResponse = profileData?.data?.data;
  const orgData: IOrgProfileResponse | undefined = profileResponse?.user;

  // Keep local edits, but render server values until user changes.
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftGeneralNumber, setDraftGeneralNumber] = useState<string | null>(
    null
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateLogoMutation = useUpdateOrgLogo();
  const deleteLogoMutation = useDeleteOrgLogo();

  const name = draftName ?? orgData?.name ?? '';
  const generalNumber =
    draftGeneralNumber ?? orgData?.generalNumber?.toString() ?? '';

  const handleSave = async () => {
    setSaveSuccess(false);
    try {
      await updateProfileMutation.mutateAsync({
        name: name !== orgData?.name ? name : undefined,
        generalNumber:
          generalNumber !== orgData?.generalNumber?.toString()
            ? Number(generalNumber)
            : undefined,
      });
      setDraftName(null);
      setDraftGeneralNumber(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // error is handled by mutation
    }
  };

  const hasChanges =
    name !== (orgData?.name || '') ||
    generalNumber !== (orgData?.generalNumber?.toString() || '');

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
        </div>
        <div className="mt-3 h-[2px] w-full bg-primary dark:bg-primary" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 dark:text-muted-foreground">
            Manage your account and application settings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-8 space-y-6">
        <div className="grid gap-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Logo</CardTitle>
              <CardDescription>
                Used as your organization&apos;s identity across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-border bg-muted">
                  {orgData?.logo ? (
                    <Image
                      src={orgData.logo}
                      alt="Organization logo"
                      width={96}
                      height={96}
                      className="h-24 w-24 object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG or WEBP. Max 5MB.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={updateLogoMutation.isPending}
                    >
                      {updateLogoMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-3 w-3" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    {orgData?.logo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLogoMutation.mutate()}
                        disabled={deleteLogoMutation.isPending}
                      >
                        {deleteLogoMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  {updateLogoMutation.isError && (
                    <p className="text-xs text-red-600">
                      {updateLogoMutation.error?.message || 'Upload failed'}
                    </p>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) updateLogoMutation.mutate({ file });
                  e.target.value = '';
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your organization details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Enter organization name"
                  value={name}
                  onChange={e => setDraftName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={orgData?.email || ''}
                  disabled
                  className="opacity-60"
                />
                <p className="text-muted-foreground text-xs">
                  Email cannot be changed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceCategory">Service Category</Label>
                <Input
                  id="serviceCategory"
                  value={
                    orgData?.serviceCategory
                      ?.replace('_', ' ')
                      .replace(/\b\w/g, (l: string) => l.toUpperCase()) || ''
                  }
                  disabled
                  className="opacity-60"
                />
                <p className="text-muted-foreground text-xs">
                  Contact support to change your service category
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">General Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={generalNumber}
                  onChange={e => setDraftGeneralNumber(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                {saveSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Settings saved successfully!
                  </p>
                )}
                {updateProfileMutation.isError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {updateProfileMutation.error?.message || 'Failed to save'}
                  </p>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateProfileMutation.isPending}
                  className="ml-auto"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Emergency Alerts', enabled: true },
                { label: 'Team Updates', enabled: true },
                { label: 'System Maintenance', enabled: false },
                { label: 'Weekly Reports', enabled: true },
              ].map(notification => (
                <div
                  key={notification.label}
                  className="flex items-center justify-between"
                >
                  <label className="text-sm font-medium">
                    {notification.label}
                  </label>
                  <input
                    type="checkbox"
                    defaultChecked={notification.enabled}
                    className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href="/change-password">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
