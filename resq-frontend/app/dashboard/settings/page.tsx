import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and application settings</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Manage your general preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Organization Name</label>
              <input
                type="text"
                placeholder="Enter organization name"
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm"
                defaultValue="City Emergency Services"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <input
                type="email"
                placeholder="Enter email"
                className="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm"
                defaultValue="admin@emergencyservices.com"
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Control how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Emergency Alerts', enabled: true },
              { label: 'Team Updates', enabled: true },
              { label: 'System Maintenance', enabled: false },
              { label: 'Weekly Reports', enabled: true },
            ].map(notification => (
              <div key={notification.label} className="flex items-center justify-between">
                <label className="text-sm font-medium">{notification.label}</label>
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
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Active Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
