import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Bell, X, Check, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Notification } from './useNotifications';

interface Props {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const iconMap = {
  success: <CheckCircle className="h-4 w-4 text-green-400" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
  error:   <XCircle className="h-4 w-4 text-red-400" />,
  info:    <Info className="h-4 w-4 text-blue-400" />
};

const redirectMap: Record<string, string> = {
  success: '/mails-reponses',
  warning: '/envoi-masse',
  error:   '/',
  info:    '/',
};

const iconBg: Record<string, string> = {
  success: 'rgba(34,197,94,0.1)',
  warning: 'rgba(234,179,8,0.1)',
  error:   'rgba(239,68,68,0.1)',
  info:    'rgba(59,130,246,0.1)',
};

export const NotificationPanel = ({ notifications, onMarkAllRead, onMarkRead, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const unreadCount = notifications.filter(n => !n.read).length;

  const openPanel = () => {
    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  };

  const closePanel = () => {
    setOpen(false);
    setTimeout(() => setVisible(false), 300);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const handleNotifClick = (notif: Notification) => {
    onMarkRead(notif.id);
    closePanel();
    navigate(redirectMap[notif.type] ?? '/');
  };

  // ✅ ReactDOM.createPortal → rendu dans document.body, hors de tout parent
  const portal = visible ? ReactDOM.createPortal(
    <>
      {/* Overlay sombre */}
      <div
        onClick={closePanel}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 300ms ease',
          opacity: open ? 1 : 0,
        }}
      />

      {/* Panneau latéral droit */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: '22rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        backgroundColor: '#18181b',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
      }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Bell style={{ width:15, height:15, color:'#c084fc' }} />
            <span style={{ fontWeight:600, color:'#fff', fontSize:13 }}>Alertes système</span>
            {unreadCount > 0 && (
              <span style={{ fontSize:11, background:'rgba(168,85,247,0.2)', color:'#c084fc', padding:'2px 8px', borderRadius:999 }}>
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} style={{ fontSize:11, color:'#c084fc', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                <Check style={{ width:12, height:12 }} /> Tout lire
              </button>
            )}
            <button onClick={closePanel} style={{ background:'none', border:'none', cursor:'pointer', color:'#71717a', padding:4, borderRadius:8, display:'flex' }}>
              <X style={{ width:16, height:16 }} />
            </button>
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12, padding:'48px 20px' }}>
              <CheckCircle style={{ width:36, height:36, color:'#22c55e', opacity:0.3 }} />
              <p style={{ color:'#52525b', fontSize:13 }}>Aucune alerte système</p>
            </div>
          ) : notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', background: notif.read ? 'transparent' : 'rgba(168,85,247,0.04)', position:'relative' }}
              onMouseEnter={e => (e.currentTarget.style.background = notif.read ? 'rgba(255,255,255,0.04)' : 'rgba(168,85,247,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(168,85,247,0.04)')}
            >
              <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:2, background: iconBg[notif.type] }}>
                {iconMap[notif.type]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:500, color: notif.read ? '#d4d4d8' : '#fff', marginBottom:3 }}>{notif.title}</p>
                <p style={{ fontSize:11, color:'#71717a', lineHeight:1.5 }}>{notif.message}</p>
                <p style={{ fontSize:11, color:'#52525b', marginTop:4 }}>{notif.time}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                {!notif.read && <div style={{ width:7, height:7, borderRadius:'50%', background:'#a855f7', marginTop:4 }} />}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#52525b', padding:2, display:'flex' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#52525b')}
                >
                  <X style={{ width:13, height:13 }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <span style={{ fontSize:11, color:'#52525b' }}>{notifications.length} alerte{notifications.length > 1 ? 's' : ''} au total</span>
            <button onClick={() => notifications.forEach(n => onDelete(n.id))} style={{ fontSize:11, color:'#f87171', background:'none', border:'none', cursor:'pointer' }}>
              Tout effacer
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => open ? closePanel() : openPanel()}
        className="relative flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-all duration-200 text-white"
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        <span className="text-sm font-medium">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {portal}
    </>
  );
};
