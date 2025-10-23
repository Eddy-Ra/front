import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Check, X, Bot } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {NouveauPromptPopup} from '@/components/mailaenvoyerpopup/NouveauPromptPopup';

interface Prompt {
  id: number;
  nom: string;
  contenu: string;
  categorie: string;
  utilise: number;
  dateCreation?: string;
}
interface MailGenere {
  id: number;
  destinataire: string;
  sujet: string;
  contenu: string;
  categorie: string;
  statut: string;
  genereParIA: boolean;
  dateGeneration: string;
}

const MailsAEnvoyer = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/prompt')
      .then(res => {
        if (!res.ok) throw new Error('Erreur réseau');
        return res.json();
      })
      .then((data: Prompt[]) => setPrompts(data))
      .catch(console.error);
  }, []);

  // Mails générés
  const [mailsGeneres, setMailsGeneres] = useState<MailGenere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/mailsgeneres')  // adapte l'URL si besoin
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Erreur lors de la récupération des mails générés');
        }
        return res.json();
      })
      .then((data: MailGenere[]) => {
        setMailsGeneres(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [editedContent, setEditedContent] = useState('');

  const promptColumns = [
    { key: 'nom', label: 'Nom du prompt', sortable: true },
    { key: 'categorie', label: 'Catégorie', sortable: true },
    { key: 'utilise', label: 'Utilisé', sortable: true },
    { key: 'dateCreation', label: 'Date création', sortable: true }
  ];

  const mailColumns = [
    { key: 'destinataire', label: 'Destinataire', sortable: true },
    { key: 'sujet', label: 'Sujet', sortable: true },
    { key: 'categorie', label: 'Catégorie', sortable: true },
    { key: 'statut', label: 'Statut', sortable: true },
    { key: 'genereParIA', label: 'Généré par IA' },
    { key: 'dateGeneration', label: 'Date génération', sortable: true }
  ];

  const mailFilters = [
    {
      key: 'categorie',
      label: 'Catégorie',
      options: ['Tech', 'Commerce', 'Services', 'Autres']
    },
    {
      key: 'statut',
      label: 'Statut',
      options: ['En attente', 'Validé', 'Refusé']
    }
  ];

  const handleViewMail = (mail: any) => {
    setSelectedMail(mail);
    setEditedContent(mail.contenu);
  };

  const handleValidateMail = (mail: any) => {
    console.log('Valider le mail:', mail);
  };

  const handleRejectMail = (mail: any) => {
    console.log('Refuser le mail:', mail);
  };

  const handleGenerateAIMails = () => {
    console.log('Générer des mails avec IA');
  };

  const handleSaveEdit = () => {
    console.log('Sauvegarder les modifications');
    setSelectedMail(null);
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

  return (
    <Layout title="Gestion des mails à envoyer">
      <div className="space-y-6">
        {/* SECTION: Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setIsPopupOpen(true)} className="gap-2 border-[#8675E1] border-1">

            <Plus className="h-4 w-4" />
            Nouveau prompt
          </Button>
          
          <Button onClick={handleGenerateAIMails} className="gap-2 bg-gradient-primary border-[#8675E1] border-1">
            <Bot className="h-4 w-4" />
            Générer avec IA
          </Button>
          
          <div className="ml-auto flex gap-2">
            <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
              Valider le groupe
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION: Prompts prédéfinis */}
          <Card>
            <CardHeader>
              <CardTitle>Prompts Prédéfinis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prompts.map((prompt) => (
                  <div key={prompt.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{prompt.nom}</h4>
                      <Badge variant="outline">{prompt.categorie}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {prompt.contenu}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Utilisé {prompt.utilise} fois</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 px-2 border">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 px-2 border">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SECTION: Liste des mails générés */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mails Générés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mailsGeneres.map((mail) => (
                    <div key={mail.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{mail.sujet}</h4>
                            {mail.genereParIA && (
                              <Bot className="h-4 w-4 text-primary" />
                            )}
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
                          <Badge variant="outline" className="text-xs">{mail.categorie}</Badge>
                          <span>{mail.dateGeneration}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewMail(mail)}
                            className="h-6 px-2 border"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          
                          {mail.statut === 'En attente' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleValidateMail(mail)}
                                className="h-6 px-2 border"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRejectMail(mail)}
                                className="h-6 px-2 border"
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

        {/* SECTION: Modal d'édition de mail */}
        {selectedMail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Éditer le mail</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">À:</span>
                  <span className="font-medium">{selectedMail.destinataire}</span>
                  {selectedMail.genereParIA && (
                    <Badge variant="outline" className="gap-1">
                      <Bot className="h-3 w-3" />
                      IA
                    </Badge>
                  )}
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
      <NouveauPromptPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSave={async (data) => {
          console.log('Données du nouveau prompt:', data);
          // Tu peux ici faire un POST vers ton API
          // await api.post('/prompts', data);
          setIsPopupOpen(false);
        }}
      />

    </Layout>
  );
};

export default MailsAEnvoyer;