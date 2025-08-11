import React, { useState } from 'react';
import { Plus, Eye, Edit, Check, X, Bot, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MailsRelance = () => {
  // SECTION: Données mockées des prompts de relance
  const [promptsRelance] = useState([
    {
      id: 1,
      nom: 'Relance Intéressés - Suivi',
      contenu: 'Bonjour {nom}, suite à votre intérêt pour notre proposition, je reviens vers vous pour...',
      typeReponse: 'Intéressé',
      utilise: 45,
      dateCreation: '2024-01-10'
    },
    {
      id: 2,
      nom: 'Relance Plus Tard - Rappel',
      contenu: 'Bonjour {nom}, vous m\'aviez demandé de vous recontacter dans quelques mois...',
      typeReponse: 'Intéressé plus tard',
      utilise: 23,
      dateCreation: '2024-01-08'
    },
    {
      id: 3,
      nom: 'Relance Non Réponse - 1ère',
      contenu: 'Bonjour {nom}, je me permets de revenir vers vous concernant ma proposition...',
      typeReponse: 'Non réponse',
      utilise: 67,
      dateCreation: '2024-01-05'
    }
  ]);

  // SECTION: Données mockées des mails de relance générés
  const [mailsRelance] = useState([
    {
      id: 1,
      destinataire: 'jean.dupont@entreprise.com',
      sujet: 'Suivi de notre échange',
      contenu: 'Bonjour Jean, suite à votre intérêt pour notre proposition, je reviens vers vous pour organiser notre rendez-vous...',
      typeReponse: 'Intéressé',
      statut: 'En attente',
      genereParIA: true,
      dateGeneration: '2024-01-15',
      mailOriginal: 'Bonjour, merci pour votre message. Je suis très intéressé...'
    },
    {
      id: 2,
      destinataire: 'marie.martin@commerce.fr',
      sujet: 'Nouvelle opportunité pour Commerce Plus',
      contenu: 'Bonjour Marie, j\'espère que vous allez bien. Je me permets de revenir vers vous avec une nouvelle approche...',
      typeReponse: 'Non réponse',
      statut: 'Validé',
      genereParIA: true,
      dateGeneration: '2024-01-14',
      mailOriginal: null
    },
    {
      id: 3,
      destinataire: 'pierre.bernard@services.com',
      sujet: 'Re: Rappel comme convenu',
      contenu: 'Bonjour Pierre, vous m\'aviez demandé de vous recontacter dans 6 mois. Je me permets donc de revenir vers vous...',
      typeReponse: 'Intéressé plus tard',
      statut: 'En attente',
      genereParIA: true,
      dateGeneration: '2024-01-13',
      mailOriginal: 'Votre proposition est intéressante. Recontactez-moi dans 6 mois.'
    }
  ]);

  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [editedContent, setEditedContent] = useState('');
  const [activeTab, setActiveTab] = useState('mails');

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Intéressé':
        return 'bg-success text-success-foreground';
      case 'Intéressé plus tard':
        return 'bg-warning text-warning-foreground';
      case 'Non réponse':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'En attente':
        return <Badge variant="secondary">En attente</Badge>;
      case 'Validé':
        return <Badge className="bg-success text-success-foreground">Validé</Badge>;
      case 'Refusé':
        return <Badge variant="destructive">Refusé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const handleViewMail = (mail: any) => {
    setSelectedMail(mail);
    setEditedContent(mail.contenu);
  };

  const handleValidateMail = (mail: any) => {
    console.log('Valider le mail de relance:', mail);
  };

  const handleRejectMail = (mail: any) => {
    console.log('Refuser le mail de relance:', mail);
  };

  const handleGenerateRelanceMails = () => {
    console.log('Générer des mails de relance avec IA');
  };

  const handleSaveEdit = () => {
    console.log('Sauvegarder les modifications');
    setSelectedMail(null);
  };

  const stats = {
    total: mailsRelance.length,
    enAttente: mailsRelance.filter(m => m.statut === 'En attente').length,
    valides: mailsRelance.filter(m => m.statut === 'Validé').length
  };

  return (
    <Layout title="Gestion des mails de relance">
      <div className="space-y-6">
        {/* SECTION: Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => console.log('Nouveau prompt de relance')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau prompt
          </Button>
          
          <Button onClick={handleGenerateRelanceMails} className="gap-2 bg-gradient-primary">
            <Bot className="h-4 w-4" />
            Générer relances IA
          </Button>
          
          <div className="ml-auto flex gap-2">
            <Button variant="outline" className="gap-2">
              Valider le groupe
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* SECTION: Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total relances</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Check className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-success">{stats.valides}</p>
              <p className="text-sm text-muted-foreground">Validées</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <X className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-warning">{stats.enAttente}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </CardContent>
          </Card>
        </div>

        {/* SECTION: Onglets - Prompts et Mails */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mails">Mails de Relance</TabsTrigger>
            <TabsTrigger value="prompts">Prompts de Relance</TabsTrigger>
          </TabsList>

          {/* SECTION: Onglet des mails de relance */}
          <TabsContent value="mails" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Mails de Relance Générés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mailsRelance.map((mail) => (
                        <div key={mail.id} className="p-4 border border-border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{mail.sujet}</h4>
                                {mail.genereParIA && (
                                  <Bot className="h-4 w-4 text-primary" />
                                )}
                                <Badge className={getTypeColor(mail.typeReponse)}>
                                  {mail.typeReponse}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{mail.destinataire}</p>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {mail.contenu}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(mail.statut)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{mail.dateGeneration}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewMail(mail)}
                                className="h-6 px-2"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {mail.statut === 'En attente' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleValidateMail(mail)}
                                    className="h-6 px-2 text-success hover:text-success"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleRejectMail(mail)}
                                    className="h-6 px-2 text-destructive hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* SECTION: Onglet des prompts de relance */}
          <TabsContent value="prompts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Prompts de Relance par Type de Réponse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {promptsRelance.map((prompt) => (
                    <div key={prompt.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{prompt.nom}</h4>
                        <Badge className={getTypeColor(prompt.typeReponse)}>
                          {prompt.typeReponse}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {prompt.contenu}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Utilisé {prompt.utilise} fois</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-6 px-2">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-6 px-2">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* SECTION: Modal d'édition de mail de relance */}
        {selectedMail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Éditer le mail de relance</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">À:</span>
                  <span className="font-medium">{selectedMail.destinataire}</span>
                  {selectedMail.genereParIA && (
                    <Badge variant="outline" className="gap-1">
                      <Bot className="h-3 w-3" />
                      IA
                    </Badge>
                  )}
                  <Badge className={getTypeColor(selectedMail.typeReponse)}>
                    {selectedMail.typeReponse}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Sujet</label>
                  <input 
                    type="text" 
                    defaultValue={selectedMail.sujet}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Contenu</label>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="mt-1 min-h-[200px]"
                  />
                </div>

                {selectedMail.mailOriginal && (
                  <div>
                    <label className="text-sm font-medium">Message original du contact</label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {selectedMail.mailOriginal}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedMail(null)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MailsRelance;