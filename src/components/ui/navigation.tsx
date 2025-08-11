import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  Send,
  Reply,
  RefreshCw,
  Settings,
  LogOut,
  Bell,
  Brain,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import img from '../../../public/assets/img/johndoe.jpg';

const navigationItems = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Gestion des contacts', href: '/contacts', icon: Users },
  { name: 'Mails à envoyer', href: '/mails-a-envoyer', icon: Mail },
  { name: 'Envoi en masse', href: '/envoi-masse', icon: Send },
  { name: 'Mails de réponse', href: '/mails-reponses', icon: Reply },
  { name: 'Mails de relance', href: '/mails-relance', icon: RefreshCw },
  { name: 'Paramètres', href: '/parametres', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen w-sidebar glass border-r border-border/50 backdrop-blur-xl animate-slide-up",
      className
    )}>
      {/* Logo */}
      <div className="flex h-header items-center justify-center border-b border-border/50 px-2 bg-gradient-primary/5">
        <h1 className="flex items-center gap-2 text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent font-poppins">
          <Brain className="text-purple-400 w-6 h-6" />
          OmegaBrain
        </h1>
      </div>


      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-in-out group hover-lift animate-fade-in font-poppins",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                  : "text-muted-foreground hover:bg-gradient-glass hover:text-foreground hover:shadow-md backdrop-blur-sm"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-all duration-300 ease-in-out",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground group-hover:text-primary"
              )} />
              <span className="transition-colors duration-300 ease-in-out">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {/* User section */}
      <div className="border-t border-border/50 p-4 bg-gradient-glass/30">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-glass backdrop-blur-sm border border-white/10 hover-lift">
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg animate-glow overflow-hidden">
            <img
              src={img}
              alt="Avatar utilisateur"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold font-poppins">John Doe</p>
            <p className="text-xs text-muted-foreground">admin@crm.com</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 mb-2 border-[#8675E1] border-2 text-[#8675E1]"
          onClick={() => window.location.href = '/login'}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
        {/* <div className="flex justify-center">
          <ThemeToggle />
        </div> */}
      </div>

    </aside>
  );
}

interface HeaderProps {
  title: string;
  className?: string;
}

export function Header({ title, className }: HeaderProps) {
  return (
    <header className={cn(
      "fixed top-0 left-sidebar right-0 z-30 h-header glass border-b border-border/50 backdrop-blur-xl animate-slide-up",
      className
    )}>
      <div className="flex h-full items-center justify-between px-6">
        <h2 className="text-xl font-bold text-muted-foreground font-poppins animate-fade-in">{title}</h2>

        <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button variant="glass" size="sm" className="gap-2 hover-glow">
            <Bell className="h-4 w-4" />
            Notifications
            <span className="ml-1 px-2 py-0.5 text-xs bg-gradient-primary text-primary-foreground rounded-full animate-pulse">3</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-background">
      <Sidebar />
      <Header title={title} />
      <main className="ml-sidebar pt-header">
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}