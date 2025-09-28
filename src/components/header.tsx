'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from './logo';
import { LogOut, User as UserIcon, LayoutDashboard, BarChart3 } from 'lucide-react';
import NotificationBell from './notification-bell';
import { ThemeToggle } from './theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';


const NavLink = ({ href, children, icon: Icon }: { href: string, children: React.ReactNode, icon: React.ElementType }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} legacyBehavior passHref>
            <Button variant={isActive ? "secondary" : "ghost"} className="gap-2">
                <Icon className="h-5 w-5" />
                {children}
            </Button>
        </Link>
    );
};


export default function Header() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden md:flex items-center gap-4">
               <NavLink href="/" icon={LayoutDashboard}>Dashboard</NavLink>
               <NavLink href="/analytics" icon={BarChart3}>Analytics</NavLink>
            </nav>
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>
                      {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
       <div className="md:hidden border-t">
          <div className="container flex items-center justify-center p-2">
             <nav className="flex items-center gap-4">
               <NavLink href="/" icon={LayoutDashboard}>Dashboard</NavLink>
               <NavLink href="/analytics" icon={BarChart3}>Analytics</NavLink>
            </nav>
          </div>
       </div>
    </header>
  );
}
