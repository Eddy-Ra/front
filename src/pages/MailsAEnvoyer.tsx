import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Check, X, Bot, RefreshCw, Loader2, Eye } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { NouveauPromptPopup } from '@/components/mailaenvoyerpopup/NouveauPromptPopup';
import { ModifierPromptPopup } from '@/components/mailaenvoyerpopup/ModifierPromptPopup';
import { SupprimerPromptPopup } from '@/components/mailaenvoyerpopup/SupprimerPromptPopup';
import { api } from '@/api/api';

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
  prompt_id: number; // ID du prompt utilisé pour générer ce mail
}

const MailsAEnvoyer = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isModifierPopupOpen, setIsModifierPopupOpen] = useState(false);
  const [isSupprimerPopupOpen, setIsSupprimerPopupOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [mailsGeneres, setMailsGeneres] = useState<MailGenere[]>([]);
  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  
  // État pour le filtrage par prompt
  const [selectedPromptForFilter, setSelectedPromptForFilter] = useState<number | null>(null);
  
  // États de chargement
  const [isPromptsLoading, setIsPromptsLoading] = useState(false);
  const [isMailsLoading, setIsMailsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Charger les prompts ---
  const fetchPrompts = async () => {
    setIsPromptsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/prompt?_t=${timestamp}`);
      setPrompts(res.data);
    } catch (err) {
      console.error('Erreur chargement prompts:', err);
      setError('Erreur lors du chargement des prompts');
    } finally {
      setIsPromptsLoading(false);
    }
  };

  // --- Charger les mails générés ---
  const fetchMailsGeneres = async () => {
    setIsMailsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/mailsgeneres?_t=${timestamp}`);
      setMailsGeneres(res.data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement mails générés:', err);
      setError('Erreur lors du chargement des mails générés');
    } finally {
      setIsMailsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchMailsGeneres();
  }, []);

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
    setEditedSubject(mail.sujet);
  };

  const handleValidateMail = async (mail: any) => {
    try {
      setLoading(true);
      await api.patch(`/mailsgeneres/${mail.id}`, { statut: 'Validé' });
      
      // Mise à jour immédiate de l'état
      setMailsGeneres(prev =>
        prev.map(m => m.id === mail.id ? { ...m, statut: 'Validé' } : m)
      );
    } catch (error) {
      console.error('Erreur validation mail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMail = async (mail: any) => {
    try {
      setLoading(true);
      await api.patch(`/mailsgeneres/${mail.id}`, { statut: 'Refusé' });
      
      // Mise à jour immédiate de l'état
      setMailsGeneres(prev =>
        prev.map(m => m.id === mail.id ? { ...m, statut: 'Refusé' } : m)
      );
    } catch (error) {
      console.error('Erreur refus mail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIMails = async () => {
    try {
      setLoading(true);
      const res = await api.post('/mailsgeneres/generate');
      
      // Recharger les mails après génération
      await fetchMailsGeneres();
    } catch (error) {
      console.error('Erreur génération mails IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedMail) return;

    try {
      setLoading(true);
      await api.patch(`/mailsgeneres/${selectedMail.id}`, {
        sujet: editedSubject,
        contenu: editedContent
      });

      // Mise à jour immédiate de l'état
      setMailsGeneres(prev =>
        prev.map(m =>
          m.id === selectedMail.id
            ? { ...m, sujet: editedSubject, contenu: editedContent }
            : m
        )
      );

      setSelectedMail(null);
    } catch (error) {
      console.error('Erreur sauvegarde modifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrompt = async (data: any) => {
    try {
      setLoading(true);
      await api.post('/prompt', data);
      
      // Recharger les prompts après ajout
      await fetchPrompts();
      setIsPopupOpen(false);
    } catch (error) {
      console.error('Erreur sauvegarde prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsModifierPopupOpen(true);
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setIsSupprimerPopupOpen(true);
  };

  const handlePromptSuccess = async () => {
    await fetchPrompts();
  };

  // Fonction pour gérer le clic sur un prompt (filtrage)
  const handlePromptClick = (promptId: number) => {
    setSelectedPromptForFilter(promptId === selectedPromptForFilter ? null : promptId);
  };

  // Fonction pour réinitialiser le filtre
  const handleResetFilter = () => {
    setSelectedPromptForFilter(null);
  };

  // Filtrer les mails en fonction du prompt sélectionné
  const filteredMails = selectedPromptForFilter
    ? mailsGeneres.filter(mail => mail.prompt_id === selectedPromptForFilter)
    : mailsGeneres;

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
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="space-y-6">
        {/* Affichage des erreurs */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* SECTION: Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => setIsPopupOpen(true)} 
            className="gap-2 border-[#8675E1] border-1"
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            Nouveau prompt
          </Button>
          
          
          <div className="ml-auto flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 border-[#8675E1] border-2 text-[#8675E1]"
              onClick={() => {
                fetchPrompts();
                fetchMailsGeneres();
              }}
              disabled={isPromptsLoading || isMailsLoading}
            >
              {isPromptsLoading || isMailsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Synchroniser
            </Button>
            <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
              Valider le groupe
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION: Prompts prédéfinis */}
          <Card className="flex flex-col h-full overflow-hidden pb-15">
            <CardHeader>
              <CardTitle>Prompts Prédéfinis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[50vh] p-0">
              {isPromptsLoading ? (
                <div className="flex-grow h-40 flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex-grow h-40 space-y-4 overflow-y-auto hide-scrollbar px-6 pt-0 pb-3">
                  {/* Bouton "Tous" pour réinitialiser le filtre */}
                  <div 
                    onClick={handleResetFilter}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedPromptForFilter === null 
                        ? 'border-primary bg-primary/10 shadow-sm' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Tous les mails</h4>
                      <Badge variant={selectedPromptForFilter === null ? "default" : "outline"}>
                        {mailsGeneres.length}
                      </Badge>
                    </div>
                  </div>

                  {prompts.map((prompt) => (
                    <div 
                      key={prompt.id} 
                      onClick={() => handlePromptClick(prompt.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedPromptForFilter === prompt.id 
                          ? 'border-primary bg-primary/10 shadow-sm' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{prompt.nom}</h4>
                        <Badge variant="outline">{prompt.categorie}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {prompt.contenu}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>Utilisé {prompt.utilise} fois</span>
                          {selectedPromptForFilter === prompt.id && (
                            <Badge variant="default" className="text-xs">
                              {filteredMails.length} mail(s)
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 border"
                            onClick={() => handleEditPrompt(prompt)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 border"
                            onClick={() => handleDeletePrompt(prompt)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {prompts.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground pt-3">
                      Aucun prompt trouvé.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION: Liste des mails générés */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-full overflow-hidden  pb-10">
              <CardHeader>
                <CardTitle>Mails Générés</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto hide-scrollbar">
                {isMailsLoading ? (
                  <div className="flex items-center justify-center" style={{ height: '50vh' }}>
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4" style={{ height: '50vh' }}>
                    {filteredMails.map((mail) => (
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
                                  disabled={loading}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRejectMail(mail)}
                                  className="h-6 px-2 border"
                                  disabled={loading}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredMails.length === 0 && mailsGeneres.length > 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        Aucun mail trouvé pour ce prompt.
                      </p>
                    )}
                    {mailsGeneres.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        Aucun mail généré.
                      </p>
                    )}
                  </div>
                )}
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
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
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
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedMail(null)}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSaveEdit}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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
        onSave={handleSavePrompt}
        onRefreshPrompts={fetchPrompts}
      />

      <ModifierPromptPopup
        isOpen={isModifierPopupOpen}
        onClose={() => {
          setIsModifierPopupOpen(false);
          setSelectedPrompt(null);
        }}
        prompt={selectedPrompt}
        onSuccess={handlePromptSuccess}
      />

      <SupprimerPromptPopup
        isOpen={isSupprimerPopupOpen}
        onClose={() => {
          setIsSupprimerPopupOpen(false);
          setSelectedPrompt(null);
        }}
        prompt={selectedPrompt}
        onSuccess={handlePromptSuccess}
      />
    </Layout>
  );
};

export default MailsAEnvoyer;