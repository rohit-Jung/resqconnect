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

import { Loader2, Lock, Save } from 'lucide-react';
import { useState } from 'react';

import {
  useAdminProfile,
  useAdminUpdateProfile,
} from '@/services/super-admin/auth.api';

export default function SettingsPage() {
  const { data: profileData, isLoading } = useAdminProfile();
  const updateProfileMutation = useAdminUpdateProfile();

  const profile = profileData?.data?.admin;

  const [email, setEmail] = useState(profile?.email ?? '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setSaveSuccess(false);
    try {
      await updateProfileMutation.mutateAsync({
        name: undefined,
        email: email !== profile?.email ? email : undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // error is handled by mutation
    }
  };

  const hasChanges = email !== (profile?.email || '');

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background">
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
            Manage system-wide settings
          </p>
        </div>
      </div>
      <div className="px-6 pb-8 space-y-6">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your admin profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Name</Label>
                <Input
                  id="adminName"
                  placeholder="Enter your name"
                  value=""
                  onChange={() => {
                    // disabled
                  }}
                  disabled
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Name editing is not implemented in the control plane yet.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                {saveSuccess && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Profile updated successfully!
                  </p>
                )}
                {updateProfileMutation.isError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {updateProfileMutation.error?.message || 'Failed to update'}
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
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global system parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="systemName">System Name</Label>
                <Input
                  id="systemName"
                  placeholder="Enter system name"
                  className="mt-1.5"
                  defaultValue="ResqConnect"
                  disabled
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  System name is configured via environment variables
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage admin security options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Lock className="mr-2 h-4 w-4" />
                Change Password (not implemented)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
