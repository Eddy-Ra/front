import React, { useState } from 'react';
import { Mail, ThumbsUp, ThumbsDown, Clock, Filter } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MailsReponses = () => {
  // SECTION: Données mockées des réponses
  const [reponses] = useState([
    {
      id: 1,
      expediteur: 'jean.dupont@entreprise.com',
      sujet: 'Re: Opportunité de collaboration tech',
      contenu: 'Bonjour, merci pour votre message. Je suis très intéressé par votre proposition. Pouvons-nous programmer un appel cette semaine ?',
      mailOriginal: 'Bonjour Jean Dupont, je vous contacte concernant...',
      statut: 'Intéressé',
      dateReponse: '2024-01-15 14:30',
      entreprise: 'TechCorp',
      categorie: 'Tech'
    },
    {
      id: 2,
      expediteur: 'marie.martin@commerce.fr',
      sujet: 'Re: Solutions pour votre commerce',
      contenu: 'Merci pour votre message mais nous avons déjà un prestataire pour ce type de service.',
      mailOriginal: 'Chère Marie Martin, en tant que responsable...',
      statut: 'Non intéressé',
      dateReponse: '2024-01-14 11:20',
      entreprise: 'Commerce Plus',
      categorie: 'Commerce'
    },
    {
      id: 3,
      expediteur: 'pierre.bernard@services.com',
      sujet: 'Re: Partenariat stratégique',
      contenu: 'Votre proposition est intéressante. Je ne peux pas m\'engager maintenant mais recontactez-moi dans 6 mois.',
      mailOriginal: 'Bonjour Pierre Bernard, j\'ai découvert...',
      statut: 'Intéressé plus tard',
      dateReponse: '2024-01-13 16:45',
      entreprise: 'Services Pro',
      categorie: 'Services'
    },
    {
      id: 4,
      expediteur: 'sophie.leroy@startup.io',
      sujet: 'Re: Innovation technologique',
      contenu: 'Excellent timing ! Nous cherchons justement ce type de solution. Quand pouvons-nous discuter ?',
      mailOriginal: 'Bonjour Sophie, j\'ai vu que votre startup...',
      statut: 'Intéressé',
      dateReponse: '2024-01-12 09:15',
      entreprise: 'StartupTech',
      categorie: 'Tech'
    }
  ]);

  const [selectedReponse, setSelectedReponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('toutes');

  const filteredReponses = reponses.filter(reponse => {
    if (activeTab === 'toutes') return true;
    if (activeTab === 'interesse') return reponse.statut === 'Intéressé';
    if (activeTab === 'non-interesse') return reponse.statut === 'Non intéressé';
    if (activeTab === 'plus-tard') return reponse.statut === 'Intéressé plus tard';
    return true;
  });

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Intéressé':
        return <ThumbsUp className="h-4 w-4 text-success" />;
      case 'Non intéressé':
        return <ThumbsDown className="h-4 w-4 text-destructive" />;
      case 'Intéressé plus tard':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Intéressé':
        return <Badge className="bg-success text-success-foreground">Intéressé</Badge>;
      case 'Non intéressé':
        return <Badge variant="destructive">Non intéressé</Badge>;
      case 'Intéressé plus tard':
        return <Badge className="bg-warning text-warning-foreground">Plus tard</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const stats = {
    total: reponses.length,
    interesse: reponses.filter(r => r.statut === 'Intéressé').length,
    nonInteresse: reponses.filter(r => r.statut === 'Non intéressé').length,
    plusTard: reponses.filter(r => r.statut === 'Intéressé plus tard').length
  };

  const handleChangeStatus = (reponse: any, newStatus: string) => {
    console.log('Changer statut:', reponse.id, 'vers', newStatus);
  };

  return (
    <Layout title="Gestion des réponses aux mails">
      <div className="space-y-6">
        {/* SECTION: Statistiques des réponses */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total réponses</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-success">{stats.interesse}</p>
              <p className="text-sm text-muted-foreground">Intéressés</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-warning">{stats.plusTard}</p>
              <p className="text-sm text-muted-foreground">Plus tard</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsDown className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{stats.nonInteresse}</p>
              <p className="text-sm text-muted-foreground">Non intéressés</p>
            </CardContent>
          </Card>
        </div>

        {/* SECTION: Filtres par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="toutes">Toutes ({stats.total})</TabsTrigger>
            <TabsTrigger value="interesse">Intéressés ({stats.interesse})</TabsTrigger>
            <TabsTrigger value="plus-tard">Plus tard ({stats.plusTard})</TabsTrigger>
            <TabsTrigger value="non-interesse">Non intéressés ({stats.nonInteresse})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION: Liste des réponses */}
              <div className="space-y-4">
                {filteredReponses.map((reponse) => (
                  <Card 
                    key={reponse.id} 
                    className={`cursor-pointer transition-colors hover:bg-secondary/50 ${
                      selectedReponse?.id === reponse.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedReponse(reponse)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(reponse.statut)}
                            <h4 className="font-medium">{reponse.expediteur}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{reponse.entreprise}</p>
                        </div>
                        {getStatusBadge(reponse.statut)}
                      </div>
                      
                      <h5 className="font-medium mb-2">{reponse.sujet}</h5>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {reponse.contenu}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{reponse.categorie}</Badge>
                        <span>{reponse.dateReponse}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredReponses.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucune réponse dans cette catégorie</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* SECTION: Détail de la réponse sélectionnée */}
              <div className="space-y-4">
                {selectedReponse ? (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Détail de la réponse</CardTitle>
                          {getStatusBadge(selectedReponse.statut)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Informations</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Expéditeur:</span> {selectedReponse.expediteur}</p>
                            <p><span className="font-medium">Entreprise:</span> {selectedReponse.entreprise}</p>
                            <p><span className="font-medium">Catégorie:</span> {selectedReponse.categorie}</p>
                            <p><span className="font-medium">Date:</span> {selectedReponse.dateReponse}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Sujet</h4>
                          <p className="text-sm bg-muted p-3 rounded-md">{selectedReponse.sujet}</p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Contenu de la réponse</h4>
                          <p className="text-sm bg-card border border-border p-3 rounded-md">
                            {selectedReponse.contenu}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Mail original envoyé</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md text-muted-foreground">
                            {selectedReponse.mailOriginal}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* SECTION: Actions sur la réponse */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <h5 className="font-medium">Changer le statut :</h5>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={selectedReponse.statut === 'Intéressé' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Intéressé')}
                              className="gap-2"
                            >
                              <ThumbsUp className="h-3 w-3" />
                              Intéressé
                            </Button>
                            
                            <Button
                              variant={selectedReponse.statut === 'Intéressé plus tard' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Intéressé plus tard')}
                              className="gap-2"
                            >
                              <Clock className="h-3 w-3" />
                              Plus tard
                            </Button>
                            
                            <Button
                              variant={selectedReponse.statut === 'Non intéressé' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Non intéressé')}
                              className="gap-2"
                            >
                              <ThumbsDown className="h-3 w-3" />
                              Non intéressé
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Sélectionnez une réponse pour voir les détails
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MailsReponses;