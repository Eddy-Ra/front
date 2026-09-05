import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Mail, Send, Reply,
  RefreshCw, Settings, LogOut, Bell, Brain,
  X, Check, AlertTriangle, CheckCircle, Info, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import img from '../../../public/assets/img/johndoe.jpg';
import { api } from '@/api/api';
import { useNotifications, type Notification } from '@/contexts/NotificationsContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ============================================================
// ICONES ET COULEURS
// ============================================================
const iconMap = {
  success: <CheckCircle className="h-4 w-4 text-green-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  error:   <XCircle className="h-4 w-4 text-red-400" />,
  info:    <Info className="h-4 w-4 text-blue-400" />
};

const bgMap = {
  success: 'bg-green-500/10',
  warning: 'bg-yellow-500/10',
  error:   'bg-red-500/10',
  info:    'bg-blue-500/10'
};

const getRedirectPath = (notif: Notification): string => {
  if (notif.type === 'success') return '/mails-reponses';
  if (notif.type === 'warning') return '/envoi-masse';
  if (notif.type === 'error')   return '/contacts';
  return '/dashboard';
};

// ============================================================
// NOTIFICATION PANEL
// ============================================================
interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onDeleteAll: () => void;
  onRefresh: () => void;
}

const NotificationPanel = ({
  notifications, onMarkAllRead, onMarkRead,
  onDelete, onDeleteAll, onRefresh
}: NotificationPanelProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotifClick = (notif: Notification) => {
    onMarkRead(notif.id);
    setOpen(false);
    navigate(getRedirectPath(notif));
  };

  return (
    <>
      {/* ✅ Bouton avec cloche dynamique bleu/vert */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-3 px-5 py-2.5 rounded-xl border border-white/20 bg-black/40 hover:bg-black/60 transition-all duration-200 text-white shadow-lg"
      >
        <Bell className={cn(
          "h-5 w-5 transition-colors duration-300",
          unreadCount > 0 ? "text-red-400 fill-red-400" : "text-blue-400 fill-blue-400"
        )} />
        <span className="text-base font-medium tracking-wide">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2.5 -right-2.5 h-6 w-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ✅ Portal — rendu dans le body, hors du header */}
      {createPortal(
        <>
          {/* Overlay sans blur */}
          {open && (
            <div
              className="fixed inset-0 bg-black/30 z-[9998]"
              onClick={() => setOpen(false)}
            />
          )}

          {/* Panneau latéral pleine hauteur */}
          <div
            className={cn(
              "fixed top-0 right-0 h-full w-96 z-[9999] flex flex-col",
              "bg-zinc-950 border-l border-white/10 shadow-2xl",
              "transition-transform duration-300 ease-in-out",
              open ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Header panneau */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/80">
              <div className="flex items-center gap-3">
                {/* ✅ Cloche dynamique dans le panneau aussi */}
                <Bell className={cn(
                  "h-5 w-5 transition-colors duration-300",
                  unreadCount > 0 ? "text-red-400 fill-red-400" : "text-blue-400 fill-blue-400"
                )} />
                <h3 className="font-semibold text-white text-base">Alertes système</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                    Tout lire
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Liste notifications */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 text-center px-6">
                  <div className="p-4 rounded-full bg-green-500/10">
                    <CheckCircle className="h-10 w-10 text-green-400 opacity-60" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">Aucune alerte système</p>
                  <p className="text-zinc-600 text-xs">Tout fonctionne normalement</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={cn(
                      "flex items-start gap-3 px-5 py-4 transition-all duration-150 group cursor-pointer",
                      !notif.read
                        ? 'bg-purple-500/5 hover:bg-purple-500/10 border-l-2 border-l-purple-500'
                        : 'hover:bg-white/5 border-l-2 border-l-transparent'
                    )}
                  >
                    <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${bgMap[notif.type]}`}>
                      {iconMap[notif.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium",
                        !notif.read ? 'text-white' : 'text-zinc-300'
                      )}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-xs text-zinc-600 mt-1.5">{notif.time}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                      {!notif.read && (
                        <div className="h-2 w-2 rounded-full bg-purple-400" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                        className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-400/10"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-4 border-t border-white/10 bg-zinc-900/80 flex justify-between items-center">
                <span className="text-xs text-zinc-500">
                  {notifications.length} alerte{notifications.length > 1 ? 's' : ''} au total
                </span>
                <button
                  onClick={onDeleteAll}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Tout effacer
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
};

// ============================================================
// NAVIGATION ITEMS
// ============================================================
const navigationItems = [
  { name: 'Tableau de bord',      href: '/dashboard',       icon: LayoutDashboard },
  { name: 'Gestion des contacts', href: '/contacts',         icon: Users },
  { name: 'Mails à envoyer',      href: '/mails-a-envoyer', icon: Mail },
  { name: 'Envoi en masse',       href: '/envoi-masse',      icon: Send },
  { name: 'Mails de réponse',     href: '/mails-reponses',  icon: Reply },
  { name: 'Mails de relance',     href: '/mails-relance',   icon: RefreshCw },
  { name: 'Paramètres',           href: '/parametres',       icon: Settings },
];

// ============================================================
// SIDEBAR
// ============================================================
interface SidebarProps { className?: string; }

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { deleteAll } = useNotifications();

  const userStr   = localStorage.getItem('user');
  const user      = userStr ? JSON.parse(userStr) : null;
  const userName  = user?.name  || 'Utilisateur';
  const userEmail = user?.email || 'user@crm.com';

  const handleLogout = async () => {
    if (user?.id) {
      try {
        await api.patch(`/user/${user.id}`, { is_active: false });
      } catch (e) {
        console.error("Erreur déconnexion statut", e);
      }
    }
    localStorage.removeItem('user');
    deleteAll();
    navigate('/login');
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen w-sidebar glass border-r border-border/50 backdrop-blur-xl animate-slide-up",
      className
    )}>
      <div className="flex h-header items-center justify-center border-b border-border/50 px-2 bg-gradient-primary/5">
        <h1 className="flex items-center gap-2 text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent font-poppins">
          <Brain className="text-purple-400 w-6 h-6" />
          AutoProspect
        </h1>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigationItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group hover-lift animate-fade-in font-poppins",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                  : "text-muted-foreground hover:bg-gradient-glass hover:text-foreground hover:shadow-md backdrop-blur-sm"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-all duration-300",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
              )} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-4 bg-gradient-glass/30">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-glass backdrop-blur-sm border border-white/10 hover-lift">
          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg animate-glow overflow-hidden">
            <img src={img} alt="Avatar" className="h-full w-full object-cover rounded-full" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold font-poppins">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 mb-2 border-[#8675E1] border-2 text-[#8675E1]">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Déconnexion</AlertDialogTitle>
              <AlertDialogDescription>Êtes-vous sûr de vouloir vous déconnecter ?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Non</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Oui</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}

// ============================================================
// HEADER
// ============================================================
interface HeaderProps {
  title: string;
  className?: string;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onDeleteAll: () => void;
  onRefresh: () => void;
}

export function Header({
  title, className,
  notifications, onMarkAllRead, onMarkRead,
  onDelete, onDeleteAll, onRefresh
}: HeaderProps) {
  return (
    <header className={cn(
      "fixed top-0 left-sidebar right-0 z-30 h-header glass border-b border-border/50 backdrop-blur-xl animate-slide-up",
      className
    )}>
      <div className="flex h-full items-center justify-between px-6">
        <h2 className="text-xl font-bold text-muted-foreground font-poppins animate-fade-in">
          {title}
        </h2>
        <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <NotificationPanel
            notifications={notifications}
            onMarkAllRead={onMarkAllRead}
            onMarkRead={onMarkRead}
            onDelete={onDelete}
            onDeleteAll={onDeleteAll}
            onRefresh={onRefresh}
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

// ============================================================
// LAYOUT
// ============================================================
interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const {
    notifications,
    markAllRead,
    markRead,
    deleteNotif,
    deleteAll,
    checkSystemAlerts
  } = useNotifications();

  return (
    <div className="min-h-screen bg-gradient-background">
      <Sidebar />
      <Header
        title={title}
        notifications={notifications}
        onMarkAllRead={markAllRead}
        onMarkRead={markRead}
        onDelete={deleteNotif}
        onDeleteAll={deleteAll}
        onRefresh={checkSystemAlerts}
      />
      <main className="ml-sidebar pt-header">
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}