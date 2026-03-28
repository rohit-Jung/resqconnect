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
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-8">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            Organization Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>

          <div className="ml-2 flex items-center gap-2 border-l border-border pl-4">
            <Avatar className="h-7 w-7">
              <AvatarImage src="https://avatar.vercel.sh/admin" alt="Admin" />
              <AvatarFallback className="text-[10px]">AU</AvatarFallback>
            </Avatar>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
