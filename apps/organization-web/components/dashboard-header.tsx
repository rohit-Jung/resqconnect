'use client';

import { Bell, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 border-b backdrop-blur">
      <div className="flex h-24 items-center justify-between px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organization Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and control ResqConnect applications across your network
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="bg-primary absolute top-1.5 right-1.5 h-2 w-2 rounded-full" />
          </Button>

          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src="https://avatar.vercel.sh/admin"
                alt="Admin User"
              />
              <AvatarFallback>AU</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">Admin User</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
