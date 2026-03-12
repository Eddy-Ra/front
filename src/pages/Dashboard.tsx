import React, { useState, useEffect, useMemo } from 'react';
import { Users, Mail, Send, Reply, CheckCircle, AlertCircle, Loader2, ArrowUp } from 'lucide-react';
import { api } from '@/api/api';
import { Layout } from '@/components/ui/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCategoryScrollTop, setShowCategoryScrollTop] = useState(false);
  const categoryViewportRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const viewport = categoryViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleCategoryScroll = () => {
      if (viewport.scrollTop > 100) {
        setShowCategoryScrollTop(true);
      } else {
        setShowCategoryScrollTop(false);
      }
    };

    viewport.addEventListener('scroll', handleCategoryScroll);
    return () => viewport.removeEventListener('scroll', handleCategoryScroll);
  }, [loading]); // Re-run when loading changes to ensure viewport is in DOM

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [contactsRes, categoriesRes] = await Promise.all([
          api.get('/b2b_manual'),
          api.get('/categories')
        ]);
        setContacts(contactsRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des statistiques:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      title: 'Total Contacts',
      value: contacts.length.toLocaleString(),
      description: 'Contacts dans la base',
      icon: Users,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Mails Envoyés',
      value: '1,243',
      description: 'Ce mois-ci',
      icon: Send,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Réponses Reçues',
      value: '187',
      description: 'Taux de réponse: 15%',
      icon: Reply,
      trend: { value: 3, isPositive: true }
    },
    {
      title: 'Mails en Attente',
      value: '94',
      description: 'À valider',
      icon: AlertCircle,
      trend: { value: -5, isPositive: false }
    }
  ];

  const contactsByCategory = useMemo(() => {
    const total = contacts.length || 1;
    return categories.map(cat => {
      const count = contacts.filter(c => c.category_id === cat.id).length;
      return {
        name: cat.name,
        count: count,
        percentage: Math.round((count / total) * 100)
      };
    }).sort((a, b) => b.count - a.count);
  }, [contacts, categories]);

  const phantombusterCount = contacts.filter(
    (c) => c.source?.toLowerCase() === "phantombuster"
  ).length;

  const manuelCount = contacts.filter(
    (c) =>
      c.source?.toLowerCase() === "ajout manuel" ||
      c.source?.toLowerCase() === "manuel"
  ).length;

  const scrapingSources = [
    { name: 'Google Maps', status: 'active', lastSync: '2 min ago', contacts: 1523 },
    { name: 'Phantombuster', status: 'active', lastSync: '1h ago', contacts: phantombusterCount },
    { name: 'Manuel', status: 'active', lastSync: 'Continu', contacts: manuelCount }
  ];

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
        {/* SECTION: Tableau de bord - Statistiques principales */}
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
          {/* SECTION: Contacts par catégorie */}
          <Card className="glass hover-lift animate-slide-up border-white/20">
            <CardHeader className="bg-gradient-glass/30 rounded-t-xl border-b border-white/10">
              <CardTitle className="flex items-center gap-3 font-poppins text-lg">
                <div className="p-2 rounded-lg bg-gradient-primary/20 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-gradient-glass/10 relative">
              {renderContent(
                <>
                  <ScrollArea ref={categoryViewportRef} className="h-[300px] px-6 py-4">
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
                        const viewport = categoryViewportRef.current?.querySelector('[data-radix-scroll-area-viewport]');
                        if (viewport) {
                          viewport.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* SECTION: Sources de scraping */}
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
                        <div className={`h-2 w-2 rounded-full ${source.status === 'active' ? 'bg-success' : 'bg-muted'
                          }`} />
                        <div>
                          <p className="font-medium">{source.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.contacts.toLocaleString()} contacts
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {source.lastSync}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SECTION: Activité récente */}
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
                    <div className={`h-2 w-2 rounded-full ${activity.type === 'success' ? 'bg-success' : 'bg-primary'
                      }`} />
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION: Actions rapides */}
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

        {/* Floating Scroll to Top Button */}
        <div
          className={`fixed bottom-8 right-8 transition-all duration-300 transform ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
            }`}
        >
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