import React, { useState } from 'react';
import { Send, Play, Pause, History, AlertCircle, CheckCircle } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EnvoiMasse = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(50);

  // SECTION: Données mockées de l'envoi en cours
  const currentSending = {
    totalMails: 1247,
    mailsEnvoyes: 327,
    mailsEnAttente: 920,
    erreurs: 3,
    tempsEcoule: '00:15:42',
    tempsEstime: '01:23:15'
  };

  // SECTION: Historique des envois
  const [historique] = useState([
    {
      id: 1,
      date: '2024-01-15 09:30',
      totalMails: 850,
      envoyes: 847,
      erreurs: 3,
      statut: 'Terminé',
      duree: '1h 23min'
    },
    {
      id: 2,
      date: '2024-01-14 14:15',
      totalMails: 650,
      envoyes: 650,
      erreurs: 0,
      statut: 'Terminé',
      duree: '58min'
    },
    {
      id: 3,
      date: '2024-01-13 10:00',
      totalMails: 420,
      envoyes: 415,
      erreurs: 5,
      statut: 'Terminé avec erreurs',
      duree: '42min'
    }
  ]);

  // SECTION: Statuts d'envoi en temps réel
  const [statusMails] = useState([
    { email: 'jean.dupont@entreprise.com', statut: 'Envoyé', timestamp: '09:32:15' },
    { email: 'marie.martin@commerce.fr', statut: 'Envoyé', timestamp: '09:32:14' },
    { email: 'pierre.bernard@services.com', statut: 'En cours', timestamp: '09:32:13' },
    { email: 'sophie.leroy@startup.io', statut: 'En attente', timestamp: '-' },
    { email: 'contact@invalide.xx', statut: 'Erreur', timestamp: '09:32:10' }
  ]);

  const handleStartSending = () => {
    setIsRunning(true);
    // Simulation du progrès
    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 1;
      });
    }, 500);
  };

  const handlePauseSending = () => {
    setIsRunning(false);
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Envoyé':
        return 'text-success';
      case 'En cours':
        return 'text-warning';
      case 'En attente':
        return 'text-muted-foreground';
      case 'Erreur':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Envoyé':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'En cours':
        return <div className="h-4 w-4 border-2 border-warning border-t-transparent rounded-full animate-spin" />;
      case 'Erreur':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  return (
    <Layout title="Envoi en masse">
      <div className="space-y-6">
        {/* SECTION: Panneau de contrôle principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration de l'envoi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="batch-size">Taille des lots</Label>
                <Input
                  id="batch-size"
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  min="10"
                  max="100"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre de mails par séquence (10-100)
                </p>
              </div>

              <div className="pt-4">
                {!isRunning ? (
                  <Button 
                    onClick={handleStartSending} 
                    className="w-full gap-2 border"
                    disabled={currentProgress > 0 && currentProgress < 100}
                  >
                    <Play className="h-4 w-4" />
                    Lancer l'envoi en masse
                  </Button>
                ) : (
                  <Button 
                    onClick={handlePauseSending} 
                    variant="outline" 
                    className="w-full gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Mettre en pause
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>• Préparation de connexion n8n</p>
                <p>• Respect des limites SMTP</p>
                <p>• Gestion automatique des erreurs</p>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques en temps réel */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Envoi en cours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{currentSending.mailsEnvoyes}</p>
                    <p className="text-sm text-muted-foreground">Envoyés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-warning">{currentSending.mailsEnAttente}</p>
                    <p className="text-sm text-muted-foreground">En attente</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">{currentSending.erreurs}</p>
                    <p className="text-sm text-muted-foreground">Erreurs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {Math.round((currentSending.mailsEnvoyes / currentSending.totalMails) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Progression</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{currentSending.mailsEnvoyes} / {currentSending.totalMails}</span>
                  </div>
                  <Progress 
                    value={(currentSending.mailsEnvoyes / currentSending.totalMails) * 100} 
                    className="h-3"
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Temps écoulé: {currentSending.tempsEcoule}</span>
                    <span>Temps estimé: {currentSending.tempsEstime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION: Statuts d'envoi en temps réel */}
          <Card>
            <CardHeader>
              <CardTitle>Statuts en temps réel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {statusMails.map((mail, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(mail.statut)}
                      <span className="text-sm truncate">{mail.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={getStatusColor(mail.statut)}>{mail.statut}</span>
                      {mail.timestamp !== '-' && (
                        <span className="text-muted-foreground">{mail.timestamp}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION: Historique des envois */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des envois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {historique.map((envoi) => (
                  <div key={envoi.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{envoi.date}</span>
                      <Badge 
                        variant={envoi.statut === 'Terminé' ? 'default' : 'destructive'}
                        className={envoi.statut === 'Terminé' ? 'bg-success text-success-foreground' : ''}
                      >
                        {envoi.statut}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-medium">{envoi.totalMails}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Envoyés</p>
                        <p className="font-medium text-success">{envoi.envoyes}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Erreurs</p>
                        <p className="font-medium text-destructive">{envoi.erreurs}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Durée: {envoi.duree}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EnvoiMasse;