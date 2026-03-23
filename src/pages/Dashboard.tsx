import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Send, Reply, CheckCircle, AlertCircle, Loader2, ArrowUp } from 'lucide-react';
import { api } from '@/api/api';
import { Layout } from '@/components/ui/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [mails, setMails] = useState<any[]>([]);
  const [reponses, setReponses] = useState<any[]>([]);
  const [reponseEnAttente, setReponseEnAttente] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCategoryScrollTop, setShowCategoryScrollTop] = useState(false);

  // ✅ Correction : ref sur un div wrapper, pas sur ScrollArea directement
  const categoryWrapperRef = useRef<HTMLDivElement>(null);

  // ✅ Pagination complète
  const fetchAllPages = async (endpoint: string): Promise<any[]> => {
    const limit = 1000;
    let offset = 0;
    let allData: any[] = [];

    while (true) {
      const res = await api.get(endpoint, { params: { limit, offset } });
      const raw = res.data;
      const batch = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : [];

      allData = [...allData, ...batch];
      if (batch.length < limit) break;
      offset += limit;
    }

    return allData;
  };

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Correction : ref sur le div wrapper pour accéder au viewport de ScrollArea
  useEffect(() => {
    if (loading) return;
    const viewport = categoryWrapperRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    const handleCategoryScroll = () => setShowCategoryScrollTop(viewport.scrollTop > 100);
    viewport.addEventListener('scroll', handleCategoryScroll);
    return () => viewport.removeEventListener('scroll', handleCategoryScroll);
  }, [loading]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          contactsResult,
          mailsResult,
          categoriesResult,
          reponsesResult,
          reponseEnAttenteResult
        ] = await Promise.allSettled([
          fetchAllPages('/b2b_datasynch'),
          fetchAllPages('/realtimestatus'),
          fetchAllPages('/categories'),
          fetchAllPages('/b2b_mailsreponses'),
          fetchAllPages('/realtimestatus')
        ]);

        if (contactsResult.status === 'fulfilled') setContacts(contactsResult.value);
        else console.error('Erreur contacts:', contactsResult.reason);

        if (mailsResult.status === 'fulfilled') setMails(mailsResult.value);
        else console.error('Erreur mails:', mailsResult.reason);

        if (categoriesResult.status === 'fulfilled') setCategories(categoriesResult.value);
        else console.error('Erreur categories:', categoriesResult.reason);

        if (reponsesResult.status === 'fulfilled') setReponses(reponsesResult.value);
        else console.error('Erreur reponses:', reponsesResult.reason);

        if (reponseEnAttenteResult.status === 'fulfilled') {
          const filtered = reponseEnAttenteResult.value.filter(
            (item: any) => item.statut === "En cours"
          );
          setReponseEnAttente(filtered);
        } else {
          console.error('Erreur reponseEnAttente:', reponseEnAttenteResult.reason);
        }

      } catch (err) {
        console.error('Erreur inattendue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ✅ Taux de réponse dynamique avec décimales
  const tauxReponse = useMemo(() => {
    if (mails.length === 0 || reponses.length === 0) return '0';
    const taux = (reponses.length / mails.length) * 100;
    if (taux < 0.1) return taux.toFixed(2);
    if (taux < 1)   return taux.toFixed(1);
    return Math.round(taux).toString();
  }, [mails, reponses]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear  = now.getFullYear();

    // ✅ Correction : gestion correcte du mois précédent (janvier → décembre année-1)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear  = currentMonth === 0 ? currentYear - 1 : currentYear;

    const filterByMonth = (data: any[], month: number, year: number) =>
      data.filter(c => {
        if (!c.created_at) return false;
        const d = new Date(c.created_at);
        if (isNaN(d.getTime())) return false;
        return d.getMonth() === month && d.getFullYear() === year;
      }).length;

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0 && current === 0) return { value: 0, isPositive: true, label: 'Aucune donnée' };
      if (previous === 0 && current > 0)   return { value: current, isPositive: true, label: 'ce mois' };
      const diff = Math.round(((current - previous) / previous) * 100);
      return { value: Math.abs(diff), isPositive: diff >= 0, label: 'vs mois dernier' };
    };

    const contactsCurrent = filterByMonth(contacts, currentMonth, currentYear);
    const contactsPrev    = filterByMonth(contacts, prevMonth, prevYear);
    const mailsCurrent    = filterByMonth(mails, currentMonth, currentYear);
    const mailsPrev       = filterByMonth(mails, prevMonth, prevYear);
    const reponsesCurrent = filterByMonth(reponses, currentMonth, currentYear);
    const reponsesPrev    = filterByMonth(reponses, prevMonth, prevYear);
    const attenteCurrent  = filterByMonth(reponseEnAttente, currentMonth, currentYear);
    const attentePrev     = filterByMonth(reponseEnAttente, prevMonth, prevYear);

    return [
      {
        title: 'Total Contacts',
        value: contacts.length.toLocaleString(),
        description: 'Contacts dans la base',
        icon: Users,
        trend: calcTrend(contactsCurrent, contactsPrev)
      },
      {
        title: 'Mails Envoyés',
        value: mails.length.toLocaleString(),
        description: 'Ce mois-ci',
        icon: Send,
        trend: calcTrend(mailsCurrent, mailsPrev)
      },
      {
        title: 'Réponses Reçues',
        value: reponses.length.toLocaleString(),
        description: `Taux de réponse: ${tauxReponse}%`,
        icon: Reply,
        trend: calcTrend(reponsesCurrent, reponsesPrev)
      },
      {
        title: 'Mails en Attente',
        value: reponseEnAttente.length.toLocaleString(),
        description: 'À valider',
        icon: AlertCircle,
        trend: calcTrend(attenteCurrent, attentePrev)
      }
    ];
  }, [contacts, mails, reponses, reponseEnAttente, tauxReponse]);

  const contactsByCategory = useMemo(() => {
    const total = contacts.length || 1;
    return categories.map(cat => {
      const count = contacts.filter(c => c.category_id === cat.id).length;
      return {
        name: cat.name,
        count,
        percentage: Math.round((count / total) * 100)
      };
    }).sort((a, b) => b.count - a.count);
  }, [contacts, categories]);

  const scrapingSources = useMemo(() => {
    const normalize = (src: string) => src?.toLowerCase() ?? '';
    return [
      {
        name: 'Google Maps',
        status: 'active',
        lastSync: '2 min ago',
        contacts: contacts.filter(c => normalize(c.source) === 'google map').length
      },
      {
        name: 'Phantombuster',
        status: 'active',
        lastSync: '1h ago',
        contacts: contacts.filter(c => normalize(c.source) === 'phantombuster').length
      },
      {
        name: 'Manuel',
        status: 'active',
        lastSync: 'Continu',
        contacts: contacts.filter(c => ['ajout manuel', 'manuel'].includes(normalize(c.source))).length
      },
      {
        name: 'Société',
        status: 'active',
        lastSync: 'Continu',
        contacts: contacts.filter(c => normalize(c.source) === 'societe').length
      }
    ];
  }, [contacts]);

  const recentActivity = [
    { action: 'Envoi de 50 mails', time: '5 min ago', type: 'success' },
    { action: 'Validation de 12 mails', time: '15 min ago', type: 'info' },
    { action: 'Nouvelle réponse reçue', time: '23 min ago', type: 'success' },
    { action: 'Synchronisation Google Maps', time: '1h ago', type: 'info' }
  ];

  const renderContent = (content: React.ReactNode) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return content;
  };

  return (
    <Layout title="Tableau de bord">
      <div className="space-y-8 animate-fade-in">

        {/* Stats principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              trend={stat.trend}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
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
                // ✅ Correction : ref sur div wrapper, pas sur ScrollArea
                <div ref={categoryWrapperRef} className="relative">
                  <ScrollArea className="h-[300px] px-6 py-4">
                    <div className="space-y-4">
                      {contactsByCategory.length > 0 ? (
                        contactsByCategory.map((category, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{category.name}</span>
                              <span className="text-muted-foreground">{category.count}</span>
                            </div>
                            <Progress value={category.percentage} className="h-2" />
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-sm text-muted-foreground">Aucune donnée disponible</p>
                      )}
                    </div>
                  </ScrollArea>
                  {showCategoryScrollTop && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-primary/20 hover:bg-primary/30 text-primary animate-in fade-in zoom-in duration-300 backdrop-blur-sm border border-primary/20"
                      onClick={() => {
                        const viewport = categoryWrapperRef.current?.querySelector('[data-radix-scroll-area-viewport]');
                        viewport?.scrollTo({ top: 0, behavior: 'smooth' });
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
                  {scrapingSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${source.status === 'active' ? 'bg-success' : 'bg-muted'}`} />
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.contacts.toLocaleString()} contacts
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{source.lastSync}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Activité récente */}
          <Card className="lg:col-span-2 glass hover-lift animate-slide-up border-white/20" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="bg-gradient-glass/30 rounded-t-xl border-b border-white/10">
              <CardTitle className="font-poppins text-lg flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-secondary/20 backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-secondary" />
                </div>
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-glass/10">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <div className={`h-2 w-2 rounded-full ${activity.type === 'success' ? 'bg-success' : 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
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
                <button className="w-full p-4 text-left glass border border-white/20 rounded-xl hover:bg-gradient-glass hover-lift transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-success/20 group-hover:bg-gradient-success/30 transition-colors">
                      <Send className="h-5 w-5 text-success" />
                    </div>
                    <span className="font-semibold font-poppins group-hover:text-success transition-colors">Lancer un envoi</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 ml-11 font-poppins">Envoi en masse</p>
                </button>
                <button className="w-full p-4 text-left glass border border-white/20 rounded-xl hover:bg-gradient-glass hover-lift transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-secondary/20 group-hover:bg-gradient-secondary/30 transition-colors">
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    <span className="font-semibold font-poppins group-hover:text-secondary transition-colors">Synchroniser</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 ml-11 font-poppins">Sources externes</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Floating Scroll to Top */}
        <div className={`fixed bottom-8 right-8 transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
          <Button
            variant="primary"
            size="icon"
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
