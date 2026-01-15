import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit, Check, X, Bot, RefreshCw, Loader2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { NouveauPromptPopup } from '@/components/mailrelancepopup/NouveauPromptPopup';
import { ModifierPromptPopup } from '@/components/mailrelancepopup/ModifierPromptPopup';
import { SupprimerPromptPopup } from '@/components/mailrelancepopup/SupprimerPromptPopup';
import { DeleteMailConfirmationPopup } from '@/components/mailrelancepopup/DeleteMailConfirmation';
import { api } from '@/api/api';

interface Prompt {
  id: number;
  dateCreation?: string;
  nom: string;
  contenu: string;
  categorie: string;
  utilise: number;
  statut: string
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
  prompt_id: number;
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
  const [isDeleteMailPopupOpen, setIsDeleteMailPopupOpen] = useState(false);
  const [mailToDelete, setMailToDelete] = useState<MailGenere | null>(null);

  const [selectedPromptForFilter, setSelectedPromptForFilter] = useState<number | null>(null);
  // État gérant l'accordéon des statuts
  const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({});

  const [isPromptsLoading, setIsPromptsLoading] = useState(false);
  const [isMailsLoading, setIsMailsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setIsPromptsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/relance-prompt?_t=${timestamp}`);
      setPrompts(res.data);

    } catch (err) {
      console.error('Erreur chargement prompts:', err);
      setError('Erreur lors du chargement des prompts');
    } finally {
      setIsPromptsLoading(false);
    }
  };

  const fetchMailsGeneres = async () => {
    setIsMailsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/relance-mailsgen?_t=${timestamp}`);
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

  // Logique pour que tous les statuts soient fermés au chargement
  useEffect(() => {
    if (prompts.length > 0) {
      const statuses = prompts.map(p => p.statut || 'Non défini');
      const uniqueStatuses = Array.from(new Set(statuses));

      // Crée un objet où chaque statut est initialisé à 'true' (fermé/replié)
      const initialCollapsedState: Record<string, boolean> = uniqueStatuses.reduce((acc, status) => {
        acc[status] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setCollapsedStatuses(initialCollapsedState);
    }
  }, [prompts]);


  const handleViewMail = (mail: any) => {
    setSelectedMail(mail);
    setEditedContent(mail.contenu);
    setEditedSubject(mail.sujet);
  };

  const handleValidateMail = async (mail: MailGenere) => {
    try {
      setLoading(true);
      await api.patch(`/mailsgeneres/${mail.id}`, { statut: 'Validé' });

      setMailsGeneres(prev =>
        prev.map(m => m.id === mail.id ? { ...m, statut: 'Validé' } : m)
      );

      if (selectedMail && selectedMail.id === mail.id) {
        setSelectedMail(null);
      }
    } catch (error) {
      console.error('Erreur validation mail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMail = async (mail: MailGenere) => {
    try {
      setLoading(true);
      await api.patch(`/mailsgeneres/${mail.id}`, { statut: 'En attente' });

      setMailsGeneres(prev =>
        prev.map(m => m.id === mail.id ? { ...m, statut: 'En attente' } : m)
      );
    } catch (error) {
      console.error('Erreur retour en attente (rejet):', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePendingMail = async (mail: MailGenere) => {
    try {
      setLoading(true);
      await api.patch(`/mailsgeneres/${mail.id}`, { statut: 'En attente' });

      setMailsGeneres(prev =>
        prev.map(m => m.id === mail.id ? { ...m, statut: 'En attente' } : m)
      );
    } catch (error) {
      console.error('Erreur mise en attente du mail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMail = (mail: MailGenere) => {
    setMailToDelete(mail);
    setIsDeleteMailPopupOpen(true);
  };

  const confirmDeleteMail = async () => {
    if (!mailToDelete) return;

    try {
      setLoading(true);
      await api.delete(`/mailsgeneres/${mailToDelete.id}`);

      setMailsGeneres(prev => prev.filter(m => m.id !== mailToDelete.id));

      if (selectedMail && selectedMail.id === mailToDelete.id) {
        setSelectedMail(null);
      }

      setIsDeleteMailPopupOpen(false);
      setMailToDelete(null);
    } catch (error) {
      console.error('Erreur suppression mail:', error);
      setError('Erreur lors de la suppression du mail.');
    } finally {
      setLoading(false);
    }
  };


  const handleGenerateAIMails = async () => {
    try {
      setLoading(true);
      const res = await api.post('/mailsgeneres/generate');

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

      fetchPrompts();
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

  const getMailsCountForPrompt = (promptId: number): number => {
    return mailsGeneres.filter(mail => mail.prompt_id === promptId).length;
  };

  const handlePromptSuccess = async () => {
    await fetchPrompts();
  };

  const handlePromptClick = (promptId: number) => {
    setSelectedPromptForFilter(promptId === selectedPromptForFilter ? null : promptId);
  };

  const handleResetFilter = () => {
    setSelectedPromptForFilter(null);

    // Ferme tous les accordéons en définissant tous les statuts à TRUE (replié)
    const allStatusesCollapsed = Object.keys(groupedPrompts).reduce((acc, status) => {
      acc[status] = true;
      return acc;
    }, {} as Record<string, boolean>);

    setCollapsedStatuses(allStatusesCollapsed);
  };

  const generetemails = (prompt: Prompt) => {
    setPrompts(prev => prev.map(p =>
      p.id === prompt.id ? { ...p, utilise: p.utilise + 1 } : p
    ));

    try {
      setLoading(true);
      const webhookUrl = 'https://n8n.omega-connect.tech/webhook/53b181f1-7b25-4835-8509-relancemailsgenv2';
      api.post(webhookUrl, {
        prompt_id: prompt.id,
        nom: prompt.nom,
        categorie: prompt.categorie,
        contenu: prompt.contenu,
        timestamp: new Date().toISOString(),
        mode: 'generate_emails',
      });
    } catch (error) {
      console.error('Erreur génération mails pour le prompt:', error);
      setPrompts(prev => prev.map(p =>
        p.id === prompt.id ? { ...p, utilise: p.utilise - 1 } : p
      ));
    }

    setTimeout(() => {
      fetchMailsGeneres();
      setLoading(false);
    }, 25000);

    fetchPrompts();
  };

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

  const isCategoryValidated = (categorie: string, currentMailId: number): boolean => {
    return mailsGeneres.some(mail =>
      mail.categorie === categorie &&
      mail.statut === 'Validé' &&
      mail.id !== currentMailId
    );
  };

  const shouldDisableValidate = (mail: MailGenere): boolean => {
    return loading || mail.statut === 'Validé' || isCategoryValidated(mail.categorie, mail.id);
  };

  const shouldDisableReject = (mail: MailGenere): boolean => {
    return (
      loading ||
      mail.statut === 'En attente' ||
      isCategoryValidated(mail.categorie, mail.id)
    );
  };

  const shouldDisableDelete = (mail: MailGenere): boolean => {
    return loading || mail.statut === 'Validé' || isCategoryValidated(mail.categorie, mail.id);
  };

  const groupedPrompts = useMemo(() => {
    return prompts.reduce((acc, prompt) => {
      const status = prompt.statut || 'Non défini';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(prompt);
      return acc;
    }, {} as Record<string, Prompt[]>);
  }, [prompts]);

  const toggleStatus = (status: string) => {
    setCollapsedStatuses(prev => ({
      ...prev,
      [status]: !prev[status],
    }));
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
        .mail-item-disabled-overlay {
            position: absolute;
            inset: 0;
            background-color: rgba(255, 255, 255, 0.5);
            cursor: not-allowed;
            z-index: 10;
        }
        .dark .mail-item-disabled-overlay {
            background-color: rgba(0, 0, 0, 0.3);
        }
      `}</style>

      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

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

          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION: Prompts prédéfinis */}
          <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader>
              <CardTitle>Prompts Prédéfinis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[50vh] p-0">
              {isPromptsLoading ? (
                <div className="flex-grow flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto hide-scrollbar">
                  {/* Bouton "Tous" */}
                  <div
                    onClick={handleResetFilter}
                    className={`p-4 border-b cursor-pointer transition-colors ${selectedPromptForFilter === null
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-background hover:bg-muted/50 border-border'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Tous les Prompts</h4>
                      <Badge variant={selectedPromptForFilter === null ? "default" : "outline"}>
                        {mailsGeneres.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Statuts et prompts */}
                  {Object.entries(groupedPrompts).map(([status, promptsList]) => {
                    const isCollapsed = collapsedStatuses[status];
                    return (
                      <div key={status} className="border-b last:border-b-0">
                        {/* En-tête de statut */}
                        <div
                          className="p-4 border-b cursor-pointer transition-colors hover:bg-muted/50 flex items-center justify-between"
                          onClick={() => toggleStatus(status)}
                        >
                          <div className='flex items-center gap-2'>
                            <h3 className="font-semibold text-sm">
                              {status}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {promptsList.length}
                            </Badge>
                          </div>
                          {isCollapsed ?
                            <ChevronDown className="h-4 w-4 text-muted-foreground" /> :
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          }
                        </div>

                        {/* Liste des prompts */}
                        {!isCollapsed && (
                          <div className="p-4 space-y-3">
                            {promptsList.map((prompt) => {
                              const mailsCount = getMailsCountForPrompt(prompt.id);
                              const hasGeneratedMails = mailsCount > 0;
                              const showUsageCount = prompt.utilise > 0;

                              return (
                                <div
                                  key={prompt.id}
                                  onClick={() => handlePromptClick(prompt.id)}
                                  className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedPromptForFilter === prompt.id
                                    ? 'border-primary bg-primary/10 shadow-sm'
                                    : 'border-border hover:border-primary/50 hover:shadow-sm'
                                    }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm">{prompt.nom}</h4>
                                    <Badge variant="outline" className="text-xs">{prompt.categorie}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {prompt.contenu}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      {showUsageCount && (
                                        <span>Utilisé {prompt.utilise} fois</span>
                                      )}
                                      {selectedPromptForFilter === prompt.id && (
                                        <Badge variant="default" className="text-xs">
                                          {mailsCount} mail(s)
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      <>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 px-2"
                                          onClick={() => handleEditPrompt(prompt)}
                                          disabled={loading}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 px-2"
                                          onClick={() => generetemails(prompt)}
                                          disabled={loading}
                                        >
                                          <Bot className="h-3 w-3" />
                                        </Button>
                                      </>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2"
                                        onClick={() => handleDeletePrompt(prompt)}
                                        disabled={loading}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {prompts.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground p-6">
                      Aucun prompt trouvé.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION: Liste des mails générés */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-full overflow-hidden pb-6">
              <CardHeader>
                <CardTitle>Mails Générés</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow overflow-y-auto hide-scrollbar h-[60vh]">
                {isMailsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMails.map((mail) => {
                      const isAnotherMailValidated = isCategoryValidated(mail.categorie, mail.id);
                      const isItemVisuallyDisabled = isAnotherMailValidated && mail.statut !== 'Validé';

                      return (
                        <div
                          key={mail.id}
                          className={`p-4 border rounded-lg relative ${isItemVisuallyDisabled ? 'opacity-60' : ''
                            }`}
                        >
                          {isItemVisuallyDisabled && (
                            <div className="mail-item-disabled-overlay rounded-lg"></div>
                          )}
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

                          <div className="flex items-center justify-between relative z-20">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{mail.categorie}</Badge>
                              <span>{mail.dateGeneration}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewMail(mail)}
                                className="h-6 px-2"
                                disabled={loading}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleValidateMail(mail)}
                                className="h-6 px-2"
                                disabled={shouldDisableValidate(mail)}
                              >
                                <Check className="h-3 w-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectMail(mail)}
                                className="h-6 px-2"
                                disabled={shouldDisableReject(mail)}
                              >
                                <X className="h-3 w-3" />
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteMail(mail)}
                                className={`h-6 px-2 ${shouldDisableDelete(mail) ? 'text-muted-foreground opacity-50 cursor-not-allowed' : 'text-destructive hover:bg-destructive/10'}`}
                                disabled={shouldDisableDelete(mail)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredMails.length === 0 && mailsGeneres.length > 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        Aucun mail trouvé pour cette sélection.
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

        {/* Modal d'édition de mail */}
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
        nombreMailsGeneres={selectedPrompt ? getMailsCountForPrompt(selectedPrompt.id) : 0}
      />

      <DeleteMailConfirmationPopup
        isOpen={isDeleteMailPopupOpen}
        onClose={() => {
          setIsDeleteMailPopupOpen(false);
          setMailToDelete(null);
        }}
        onConfirm={confirmDeleteMail}
        mailSubject={mailToDelete?.sujet || ''}
        mailRecipient={mailToDelete?.destinataire || ''}
        loading={loading}
      />
    </Layout>
  );
};

export default MailsAEnvoyer;
