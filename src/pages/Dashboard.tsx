import React from 'react';
import { Users, Mail, Send, Reply, CheckCircle, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  // SECTION: Données mockées pour le dashboard
  const stats = [
    {
      title: 'Total Contacts',
      value: '2,847',
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

  const contactsByCategory = [
    { name: 'Entreprises Tech', count: 1247, percentage: 44 },
    { name: 'Commerce', count: 863, percentage: 30 },
    { name: 'Services', count: 542, percentage: 19 },
    { name: 'Autres', count: 195, percentage: 7 }
  ];

  const scrapingSources = [
    { name: 'Google Maps', status: 'active', lastSync: '2 min ago', contacts: 1523 },
    { name: 'Phantombuster', status: 'active', lastSync: '1h ago', contacts: 894 },
    { name: 'Manuel', status: 'active', lastSync: 'Continu', contacts: 430 }
  ];

  const recentActivity = [
    { action: 'Envoi de 50 mails', time: '5 min ago', type: 'success' },
    { action: 'Validation de 12 mails', time: '15 min ago', type: 'info' },
    { action: 'Nouvelle réponse reçue', time: '23 min ago', type: 'success' },
    { action: 'Synchronisation Google Maps', time: '1h ago', type: 'info' }
  ];

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
                Contacts par Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-glass/10">
              <div className="space-y-4">
                {contactsByCategory.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">{category.count}</span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {scrapingSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        source.status === 'active' ? 'bg-success' : 'bg-muted'
                      }`} />
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {source.contacts} contacts
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
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === 'success' ? 'bg-success' : 'bg-primary'
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
                    <div className="p-2 rounded-lg bg-gradient-primary/20 group-hover:bg-gradient-primary/30 transition-colors">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold font-poppins group-hover:text-primary transition-colors">Valider les mails</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 ml-11 font-poppins">94 en attente</p>
                </button>
                
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
      </div>
    </Layout>
  );
};

export default Dashboard;