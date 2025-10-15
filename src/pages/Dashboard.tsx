import React from 'react';
import { Users, Mail, Send, Reply, CheckCircle, AlertCircle, Brain, Shield, Download, BarChart3 } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Données mockées
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
    { action: 'Synchronisation Google Maps', time: '1h ago', type: 'info' },
    { action: 'Sauvegarde automatique', time: '2h ago', type: 'success' }
  ];

  if (!token) {
    window.location.href = '/login';
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-muted-foreground">Bienvenue, {user.name} ! Voici votre aperçu.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Admin</Badge>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} title={stat.title} value={stat.value} description={stat.description} icon={stat.icon} trend={stat.trend} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacts par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contactsByCategory.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">{category.count} contacts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{category.percentage}%</p>
                      <Progress value={category.percentage} className="mt-1 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sources de Scraping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scrapingSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={source.status === 'active' ? 'default' : 'secondary'}>
                        {source.status}
                      </Badge>
                      <div>
                        <p className="font-medium">{source.name}</p>
                        <p className="text-xs text-muted-foreground">Dernière sync: {source.lastSync}</p>
                      </div>
                    </div>
                    <Badge className="text-sm">{source.contacts} contacts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900">
                  <div className={`p-2 rounded-full ${activity.type === 'success' ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                    {activity.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Brain className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="w-full p-4 text-left glass border border-white/20 rounded-xl hover:bg-gradient-glass hover-lift transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-primary/20 group-hover:bg-gradient-primary/30 transition-colors">
                      <Shield className="h-5 w-5 text-primary" />
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