import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Send, Reply, CheckCircle, AlertCircle, Loader2, ArrowUp, RefreshCw } from 'lucide-react';
import { api } from '@/api/api';
import { Layout } from '@/components/ui/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// ─── Constantes ───────────────────────────────────────────────────────────────
const SYNC_CURSOR_KEY = 'dashboard_sync_last_id';
const BATCH_SIZE      = 500;

// ─── Types ────────────────────────────────────────────────────────────────────
type ActivityEvent = {
  action: string;
  time:   string;
  type:   'success' | 'info' | 'sync';
};

type SyncProgress = {
  currentBatch: number;
  totalSynced:  number;
  lastId:       number | null;
  done:         boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRelativeTime = (date: Date): string => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}j ago`;
};

const buildActivityFromData = (
  mails: any[],
  reponses: any[],
  reponseEnAttente: any[]
): ActivityEvent[] => {
  const events: { action: string; time: Date; type: 'success' | 'info' }[] = [];

  mails.forEach(m => {
    if (m.created_at) events.push({
      action: `Mail envoyé à ${m.email ?? m.nom ?? m.contact ?? 'un contact'}`,
      time: new Date(m.created_at), type: 'info',
    });
  });
  reponses.forEach(r => {
    if (r.created_at) events.push({
      action: `Réponse reçue de ${r.email ?? r.nom ?? r.contact ?? 'un contact'}`,
      time: new Date(r.created_at), type: 'success',
    });
  });
  reponseEnAttente.forEach(i => {
    if (i.created_at) events.push({
      action: `Mail en attente — ${i.email ?? i.nom ?? i.contact ?? 'contact inconnu'}`,
      time: new Date(i.created_at), type: 'info',
    });
  });

  return events
    .filter(e => !isNaN(e.time.getTime()))
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 10)
    .map(e => ({ ...e, time: formatRelativeTime(e.time) }));
};

// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();

  const [contacts, setContacts]                 = useState<any[]>([]);
  const [mails, setMails]                       = useState<any[]>([]);
  const [reponses, setReponses]                 = useState<any[]>([]);
  const [reponseEnAttente, setReponseEnAttente] = useState<any[]>([]);
  const [categories, setCategories]             = useState<any[]>([]);
  const [loading, setLoading]                   = useState(true);

  // ── Sync ──────────────────────────────────────────────────────────────────
  const [isSyncing, setIsSyncing]       = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  // ── Activité récente (séparée pour mise à jour live pendant la sync) ──────
  const [liveActivity, setLiveActivity] = useState<ActivityEvent[] | null>(null);
  // null = utiliser les données normales, non-null = override live pendant sync

  const [showScrollTop, setShowScrollTop]               = useState(false);
  const [showCategoryScrollTop, setShowCategoryScrollTop] = useState(false);
  const categoryWrapperRef  = useRef<HTMLDivElement>(null);
  const activityScrollRef   = useRef<HTMLDivElement>(null);

  // ── Scroll listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (loading) return;
    const vp = categoryWrapperRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!vp) return;
    const h = () => setShowCategoryScrollTop(vp.scrollTop > 100);
    vp.addEventListener('scroll', h);
    return () => vp.removeEventListener('scroll', h);
  }, [loading]);

  // ── Pagination complète ───────────────────────────────────────────────────
  const fetchAllPages = async (endpoint: string): Promise<any[]> => {
    const limit = 1000;
    let offset  = 0;
    let allData: any[] = [];
    while (true) {
      const res   = await api.get(endpoint, { params: { limit, offset } });
      const raw   = res.data;
      const batch = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      allData     = [...allData, ...batch];
      if (batch.length < limit) break;
      offset += limit;
    }
    return allData;
  };

  // ── Chargement mutualisé ──────────────────────────────────────────────────
  const loadAllData = async () => {
    const [cR, mR, catR, repR, attR] = await Promise.allSettled([
      fetchAllPages('/b2b_datasynch'),
      fetchAllPages('/realtimestatus'),
      fetchAllPages('/categories'),
      fetchAllPages('/b2b_mailsreponses'),
      fetchAllPages('/realtimestatus'),
    ]);
    if (cR.status   === 'fulfilled') setContacts(cR.value);
    if (mR.status   === 'fulfilled') setMails(mR.value);
    if (catR.status === 'fulfilled') setCategories(catR.value);
    if (repR.status === 'fulfilled') setReponses(repR.value);
    if (attR.status === 'fulfilled') {
      setReponseEnAttente(attR.value.filter((i: any) => i.statut === 'En cours'));
    }
  };

  useEffect(() => {
    const init = async () => {
      try { await loadAllData(); }
      catch (e) { console.error(e); }
      finally   { setLoading(false); }
    };
    init();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ SYNCHRONISATION PAR CURSEUR + MISE À JOUR LIVE DE L'ACTIVITÉ RÉCENTE
  // ─────────────────────────────────────────────────────────────────────────
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(null);

    // Snapshot de l'activité actuelle au début de la sync
    // → on la garde comme base et on y ajoute les événements au fil des batches
    const baseActivity: ActivityEvent[] = buildActivityFromData(mails, reponses, reponseEnAttente);
    const syncEvents: ActivityEvent[]   = [];

    // Fonction utilitaire : insère l'event en tête et coupe à 10 items
    const pushLiveEvent = (event: ActivityEvent) => {
      syncEvents.unshift(event);           // plus récent en premier
      const merged = [...syncEvents, ...baseActivity].slice(0, 10);
      setLiveActivity(merged);

      // Auto-scroll vers le haut de l'activité récente pour voir le nouveau event
      const vp = activityScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      vp?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    try {
      const stored = localStorage.getItem(SYNC_CURSOR_KEY);
      let lastId: number = stored ? parseInt(stored, 10) : 0;

      let batchNumber = 0;
      let totalSynced = 0;
      let hasMore     = true;

      console.log(`[Sync] Démarrage — curseur initial : id > ${lastId}`);

      while (hasMore) {
        batchNumber++;
        setSyncProgress({ currentBatch: batchNumber, totalSynced, lastId, done: false });

        // Événement live : "Sync batch #N en cours…"
        pushLiveEvent({
          action: `🔄 Sync batch #${batchNumber} — récupération depuis id = ${lastId}…`,
          time:   formatRelativeTime(new Date()),
          type:   'sync',
        });

        // 1. Webhook n8n
        await api.post(
          'https://n8n.projets-omega.net/webhook/c9118e3f-fc01-478e-9031-a5a7dee8c53e',
          {
            action:    'sync_trigger',
            source:    'manual_button',
            timestamp: new Date().toISOString(),
            last_id:   lastId,
            limit:     BATCH_SIZE,
          }
        );

        // 2. Fetch du batch
        const res = await api.get('/b2b_datasynch', {
          params: { last_id: lastId, limit: BATCH_SIZE },
        });
        const raw: any[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        console.log(`[Sync] Batch #${batchNumber} — ${raw.length} contacts (id > ${lastId})`);

        // 3. Batch vide → fin
        if (raw.length === 0) {
          pushLiveEvent({
            action: `✅ Sync terminée — aucun nouveau contact après id = ${lastId}`,
            time:   formatRelativeTime(new Date()),
            type:   'success',
          });
          hasMore = false;
          break;
        }

        // 4. Mémoriser le curseur
        const newLastId = Math.max(...raw.map((c: any) => Number(c.id)));
        lastId          = newLastId;
        totalSynced    += raw.length;
        localStorage.setItem(SYNC_CURSOR_KEY, String(newLastId));

        // 5. Événement live : résumé du batch
        pushLiveEvent({
          action: `✅ Batch #${batchNumber} — ${raw.length} contacts synchronisés (curseur → id = ${newLastId})`,
          time:   formatRelativeTime(new Date()),
          type:   'success',
        });

        // 6. Contacts notables du batch ajoutés en live (max 3 pour ne pas saturer)
        raw.slice(0, 3).forEach((contact: any) => {
          const name = contact.full_name ?? contact.nom ?? contact.email ?? 'Contact inconnu';
          pushLiveEvent({
            action: `👤 Nouveau contact synchronisé : ${name}`,
            time:   formatRelativeTime(new Date()),
            type:   'info',
          });
        });
        if (raw.length > 3) {
          pushLiveEvent({
            action: `… et ${raw.length - 3} autre(s) contact(s) dans ce batch`,
            time:   formatRelativeTime(new Date()),
            type:   'info',
          });
        }

        setSyncProgress({ currentBatch: batchNumber, totalSynced, lastId: newLastId, done: false });

        if (raw.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      // Événement final
      pushLiveEvent({
        action: `🎉 Synchronisation complète — ${totalSynced.toLocaleString()} contacts traités`,
        time:   formatRelativeTime(new Date()),
        type:   'success',
      });

      setSyncProgress({ currentBatch: batchNumber, totalSynced, lastId, done: true });

      // Recharge complète des données UI
      await loadAllData();

      console.log(`[Sync] ✅ Complet — ${totalSynced} contacts, curseur = ${lastId}`);

    } catch (error) {
      console.error('[Sync] ❌ Erreur:', error);
      pushLiveEvent({
        action: `❌ Erreur de synchronisation — vérifiez la console`,
        time:   formatRelativeTime(new Date()),
        type:   'sync',
      });
      setSyncProgress(null);
    } finally {
      setIsSyncing(false);
      // Garder l'activité live 8s puis repasser aux données normales
      setTimeout(() => {
        setLiveActivity(null);
        setSyncProgress(null);
      }, 8000);
    }
  };

  const handleResetCursor = () => {
    localStorage.removeItem(SYNC_CURSOR_KEY);
    setSyncProgress(null);
    console.log('[Sync] Curseur réinitialisé');
  };

  // ── Activité récente : live si sync en cours, sinon données normales ───────
  const normalActivity = useMemo(
    () => buildActivityFromData(mails, reponses, reponseEnAttente),
    [mails, reponses, reponseEnAttente]
  );
  const recentActivity: ActivityEvent[] = liveActivity ?? normalActivity;

  // ── Stats ─────────────────────────────────────────────────────────────────
  const tauxReponse = useMemo(() => {
    if (!mails.length || !reponses.length) return '0';
    const t = (reponses.length / mails.length) * 100;
    if (t < 0.1) return t.toFixed(2);
    if (t < 1)   return t.toFixed(1);
    return Math.round(t).toString();
  }, [mails, reponses]);

  const stats = useMemo(() => {
    const now  = new Date();
    const cm   = now.getMonth(), cy = now.getFullYear();
    const pm   = cm === 0 ? 11 : cm - 1;
    const py   = cm === 0 ? cy - 1 : cy;

    const byMonth = (data: any[], m: number, y: number) =>
      data.filter(c => {
        if (!c.created_at) return false;
        const d = new Date(c.created_at);
        return !isNaN(d.getTime()) && d.getMonth() === m && d.getFullYear() === y;
      }).length;

    const trend = (cur: number, prev: number) => {
      if (!prev && !cur)  return { value: 0,             isPositive: true,     label: 'Aucune donnée'   };
      if (!prev && cur)   return { value: cur,            isPositive: true,     label: 'ce mois'         };
      const d = Math.round(((cur - prev) / prev) * 100);
      return                     { value: Math.abs(d),    isPositive: d >= 0,   label: 'vs mois dernier' };
    };

    return [
      { title: 'Total Contacts',   value: contacts.length.toLocaleString(),        description: 'Contacts dans la base',          icon: Users,        trend: trend(byMonth(contacts, cm, cy),        byMonth(contacts, pm, py))        },
      { title: 'Mails Envoyés',    value: mails.length.toLocaleString(),            description: 'Ce mois-ci',                     icon: Send,         trend: trend(byMonth(mails, cm, cy),           byMonth(mails, pm, py))           },
      { title: 'Réponses Reçues',  value: reponses.length.toLocaleString(),         description: `Taux de réponse: ${tauxReponse}%`, icon: Reply,      trend: trend(byMonth(reponses, cm, cy),        byMonth(reponses, pm, py))        },
      { title: 'Mails en Attente', value: reponseEnAttente.length.toLocaleString(), description: 'À valider',                      icon: AlertCircle,  trend: trend(byMonth(reponseEnAttente, cm, cy), byMonth(reponseEnAttente, pm, py)) },
    ];
  }, [contacts, mails, reponses, reponseEnAttente, tauxReponse]);

  const contactsByCategory = useMemo(() => {
    const total = contacts.length || 1;
    return categories
      .map(cat => {
        const count = contacts.filter(c => c.category_id === cat.id).length;
        return { name: cat.name, count, percentage: Math.round((count / total) * 100) };
      })
      .sort((a, b) => b.count - a.count);
  }, [contacts, categories]);

  const scrapingSources = useMemo(() => {
    const n = (s: string) => s?.toLowerCase() ?? '';
    return [
      { name: 'Google Maps',   status: 'active', lastSync: '2 min ago', contacts: contacts.filter(c => n(c.source) === 'google map').length    },
      { name: 'Phantombuster', status: 'active', lastSync: '1h ago',    contacts: contacts.filter(c => n(c.source) === 'phantombuster').length  },
      { name: 'Manuel',        status: 'active', lastSync: 'Continu',   contacts: contacts.filter(c => ['ajout manuel','manuel'].includes(n(c.source))).length },
      { name: 'Société',       status: 'active', lastSync: 'Continu',   contacts: contacts.filter(c => n(c.source) === 'societe').length        },
    ];
  }, [contacts]);

  const renderContent = (content: React.ReactNode) =>
    loading
      ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      : content;

  const envoiMasse = () => {
    navigate('/envoi-masse');
  };

  const storedCursor = localStorage.getItem(SYNC_CURSOR_KEY);

  // ─── Couleur de l'indicateur selon le type d'événement ───────────────────
  const activityDotColor = (type: ActivityEvent['type']) => {
    if (type === 'success') return 'bg-success';
    if (type === 'sync')    return 'bg-secondary animate-pulse';
    return 'bg-primary';
  };

  return (
    <Layout title="Tableau de bord">
      <div className="space-y-8 animate-fade-in">

        {/* Stats principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} title={stat.title} value={stat.value} description={stat.description}
              icon={stat.icon} trend={stat.trend} className="animate-scale-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Contacts par catégorie */}
          <Card className="glass hover-lift animate-slide-up border-white/20">
            <CardHeader className="bg-gradient-glass/30 rounded-t-xl border-b border-white/10">
              <CardTitle className="flex items-center gap-3 font-poppins text-lg">
                <div className="p-2 rounded-lg bg-gradient-primary/20 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                Contacts par catégorie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-gradient-glass/10 relative">
              {renderContent(
                <div ref={categoryWrapperRef} className="relative">
                  <ScrollArea className="h-[300px] px-6 py-4">
                    <div className="space-y-4">
                      {contactsByCategory.length > 0
                        ? contactsByCategory.map((cat, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{cat.name}</span>
                              <span className="text-muted-foreground">{cat.count}</span>
                            </div>
                            <Progress value={cat.percentage} className="h-2" />
                          </div>
                        ))
                        : <p className="text-center text-sm text-muted-foreground">Aucune donnée disponible</p>
                      }
                    </div>
                  </ScrollArea>
                  {showCategoryScrollTop && (
                    <Button variant="ghost" size="icon"
                      className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-primary/20 hover:bg-primary/30 text-primary animate-in fade-in zoom-in duration-300 backdrop-blur-sm border border-primary/20"
                      onClick={() => {
                        const vp = categoryWrapperRef.current?.querySelector('[data-radix-scroll-area-viewport]');
                        vp?.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sources de scraping */}
          <Card className="glass hover-lift animate-slide-up border-white/20" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="bg-gradient-glass/30 rounded-t-xl border-b border-white/10">
              <CardTitle className="flex items-center gap-3 font-poppins text-lg">
                <div className="p-2 rounded-lg bg-gradient-success/20 backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                Sources de Scraping
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-glass/10">
              {renderContent(
                <div className="space-y-4">
                  {scrapingSources.map((src, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${src.status === 'active' ? 'bg-success' : 'bg-muted'}`} />
                        <div>
                          <p className="font-medium">{src.name}</p>
                          <p className="text-sm text-muted-foreground">{src.contacts.toLocaleString()} contacts</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{src.lastSync}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Activité Récente ─────────────────────────────────────────── */}
          <Card className="lg:col-span-2 glass hover-lift animate-slide-up border-white/20" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="bg-gradient-glass/30 rounded-t-xl border-b border-white/10">
              <CardTitle className="font-poppins text-lg flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-secondary/20 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-secondary" />
                </div>
                Activité Récente
                {/* Badge "LIVE" visible pendant la sync */}
                {isSyncing && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/20 text-secondary border border-secondary/30 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary inline-block" />
                    LIVE
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-glass/10">
              {renderContent(
                <div ref={activityScrollRef}>
                  <ScrollArea className="h-[260px]">
                    <div className="space-y-3 pr-2">
                      {recentActivity.length > 0
                        ? recentActivity.map((activity, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-300 ${
                              activity.type === 'sync'
                                ? 'border-secondary/30 bg-secondary/5'
                                : 'border-border'
                            }`}
                          >
                            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${activityDotColor(activity.type)}`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm truncate ${activity.type === 'sync' ? 'text-secondary' : ''}`}>
                                {activity.action}
                              </p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                          </div>
                        ))
                        : <p className="text-center text-sm text-muted-foreground py-8">Aucune activité récente</p>
                      }
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Actions Rapides ──────────────────────────────────────────── */}
          <Card className="glass hover-lift animate-slide-up border-white/20" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="bg-gradient-glass/30 rounded-t-xl border-b border-white/10">
              <CardTitle className="font-poppins text-lg flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-primary/20 backdrop-blur-sm">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-glass/10">
              <div className="space-y-4">

                {/* Lancer un envoi */}
                <button onClick={envoiMasse}
                  className="w-full p-4 text-left glass border border-white/20 rounded-xl hover:bg-gradient-glass hover-lift transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-success/20 group-hover:bg-gradient-success/30 transition-colors">
                      <Send className="h-5 w-5 text-success" />
                    </div>
                    <span className="font-semibold font-poppins group-hover:text-success transition-colors">Lancer un envoi</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 ml-11 font-poppins">Envoi en masse</p>
                </button>

                {/* ── Synchroniser par curseur ───────────────────────────── */}
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full p-4 text-left glass border border-white/20 rounded-xl hover:bg-gradient-glass hover-lift transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-secondary/20 group-hover:bg-gradient-secondary/30 transition-colors">
                      {isSyncing
                        ? <Loader2 className="h-5 w-5 text-secondary animate-spin" />
                        : <RefreshCw className="h-5 w-5 text-secondary" />
                      }
                    </div>
                    <span className="font-semibold font-poppins group-hover:text-secondary transition-colors">
                      {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                    </span>
                  </div>

                  {/* Progression live */}
                  {isSyncing && syncProgress && !syncProgress.done && (
                    <div className="mt-3 ml-11 space-y-1">
                      <p className="text-xs text-muted-foreground font-poppins">
                        Batch #{syncProgress.currentBatch} — {syncProgress.totalSynced.toLocaleString()} contacts traités
                      </p>
                      <p className="text-xs text-muted-foreground/60 font-poppins">
                        Curseur : id = {syncProgress.lastId ?? 0}
                      </p>
                      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden mt-1">
                        <div className="h-1 bg-secondary rounded-full animate-pulse w-full" />
                      </div>
                    </div>
                  )}

                  {/* Succès */}
                  {!isSyncing && syncProgress?.done && (
                    <div className="mt-3 ml-11">
                      <p className="text-xs text-success font-poppins">
                        ✅ {syncProgress.totalSynced.toLocaleString()} contacts synchronisés
                      </p>
                      <p className="text-xs text-muted-foreground/60 font-poppins">
                        Curseur mémorisé : id = {syncProgress.lastId}
                      </p>
                    </div>
                  )}

                  {/* État de repos */}
                  {!isSyncing && !syncProgress && (
                    <p className="text-xs text-muted-foreground mt-2 ml-11 font-poppins">
                      {storedCursor
                        ? `↪ Reprend depuis id = ${storedCursor}`
                        : 'Synchronisation Directe'}
                    </p>
                  )}
                </button>

                {/* Reset curseur */}
                {storedCursor && !isSyncing && (
                  <button
                    onClick={handleResetCursor}
                    className="w-full px-4 py-2 text-xs text-muted-foreground/60 hover:text-destructive border border-dashed border-white/10 hover:border-destructive/40 rounded-lg transition-all duration-200 font-poppins"
                  >
                    ↺ Réinitialiser le curseur (repartir de id = 0)
                  </button>
                )}

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Scroll to Top */}
        <div className={`fixed bottom-8 right-8 transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <Button variant="primary" size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-gradient-primary hover:scale-110 transition-transform duration-200"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ArrowUp className="h-6 w-6 text-white" />
          </Button>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
