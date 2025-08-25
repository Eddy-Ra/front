import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Eye, Edit, Check, X, Bot, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAiEmailResponses, updateAiEmailResponse, AiEmailResponse, fetchPromptsRelance, PromptRelance, updatePromptRelance, deletePromptRelance, createPromptRelance, createAiEmailResponse } from '@/lib/api';
import Modal from '@/components/Modal';

const MailsRelance = () => {

  const [promptsRelance, setPromptsRelance] = useState<PromptRelance[]>([]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AiEmailResponse[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const loadEmails = async () => {
      try {
        console.log('Chargement des emails...');
        const res = await fetchAiEmailResponses(page, 50);
        console.log('Emails chargés:', res);
        if (mounted) {
          setItems(res.items);
          setTotal(res.total);
        }
      } catch (error) {
        console.error('Erreur chargement emails:', error);
        if (mounted) {
          setError('Erreur lors du chargement des emails');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadEmails();
    return () => {
      mounted = false;
    };
  }, [page]);

  
  useEffect(() => {
    let mounted = true;
    const loadPrompts = async () => {
      try {
        console.log('Chargement des prompts...');
        const res = await fetchPromptsRelance(1, 50);
        console.log('Prompts chargés:', res);
        if (mounted) {
          setPromptsRelance(res.items || []);
        }
      } catch (error) {
        console.error('Erreur chargement prompts:', error);
        if (mounted) {
          setError('Erreur lors du chargement des prompts');
        }
      }
    };
    loadPrompts();
    return () => { mounted = false; };
  }, []);

  const [selectedMail, setSelectedMail] = useState<any>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedSubject, setEditedSubject] = useState('');
  const [activeTab, setActiveTab] = useState('mails');

 
  const [selectedPrompt, setSelectedPrompt] = useState<PromptRelance | null>(null);
  const [editedPromptLabel, setEditedPromptLabel] = useState('');
  const [editedPromptSubject, setEditedPromptSubject] = useState('');
  const [editedPromptMessage, setEditedPromptMessage] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(false);

  
  const [showNewPromptModal, setShowNewPromptModal] = useState(false);
  const [newPromptLabel, setNewPromptLabel] = useState('');
  const [newPromptType, setNewPromptType] = useState('Non réponse');
  const [newPromptSubject, setNewPromptSubject] = useState('');
  const [newPromptMessage, setNewPromptMessage] = useState('');
  const [creatingPrompt, setCreatingPrompt] = useState(false);


  const [showGenerateIaModal, setShowGenerateIaModal] = useState(false);
  const [genEmail, setGenEmail] = useState('');
  const [genSubject, setGenSubject] = useState('');
  const [genMessage, setGenMessage] = useState('');
  const [creatingMail, setCreatingMail] = useState(false);

  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const [refreshing, setRefreshing] = useState(false);

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
    setEditedSubject(mail.sujet);
  };

  const [savingId, setSavingId] = useState<number | null>(null);
  const handleValidateMail = async (mail: any) => {
    try {
      setSavingId(mail.id);
      await updateAiEmailResponse(mail.id, {
        validated_by_admin: true,
        validated_at: new Date().toISOString(),
      });
      
      const res = await fetchAiEmailResponses(page, 15);
      setItems(res.items);
      setTotal(res.total);
      forceStatsUpdate(); 
    } catch (e) {
      console.error(e);
      setError('Erreur lors de la validation');
    } finally {
      setSavingId(null);
    }
  };

  const handleRejectMail = async (mail: any) => {
    try {
      setSavingId(mail.id);
      await updateAiEmailResponse(mail.id, {
        validated_by_admin: false,
        validated_at: new Date().toISOString(),
      });
      const res = await fetchAiEmailResponses(page, 15);
      setItems(res.items);
      setTotal(res.total);
      forceStatsUpdate(); 
    } catch (e) {
      console.error(e);
      setError('Erreur lors du refus');
    } finally {
      setSavingId(null);
    }
  };

  const handleGenerateRelanceMails = () => {
    setShowGenerateIaModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedMail) return;
    try {
      setSavingId(selectedMail.id);
      await updateAiEmailResponse(selectedMail.id, {
        message: editedContent,
        subject: editedSubject,
      });
      const res = await fetchAiEmailResponses(page, 15);
      setItems(res.items);
      setTotal(res.total);
      forceStatsUpdate(); 
      setSelectedMail(null);
    } catch (e) {
      console.error(e);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSavingId(null);
    }
  };

 
  const handleViewPrompt = (prompt: PromptRelance) => {
    setSelectedPrompt(prompt);
    setEditedPromptLabel(prompt.label);
    setEditedPromptSubject(prompt.subject_template);
    setEditedPromptMessage(prompt.message_template);
    setEditingPrompt(false);
  };

  const handleEditPrompt = (prompt: PromptRelance) => {
    setSelectedPrompt(prompt);
    setEditedPromptLabel(prompt.label);
    setEditedPromptSubject(prompt.subject_template);
    setEditedPromptMessage(prompt.message_template);
    setEditingPrompt(true);
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    try {
      setSavingId(selectedPrompt.id);
      await updatePromptRelance(selectedPrompt.id, {
        label: editedPromptLabel,
        subject_template: editedPromptSubject,
        message_template: editedPromptMessage,
      });
      
      const res = await fetchPromptsRelance(1, 50);
      setPromptsRelance(res.items || []);
      setSelectedPrompt(null);
      setEditingPrompt(false);
    } catch (e) {
      console.error(e);
      setError('Erreur lors de la sauvegarde du prompt');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeletePrompt = async (prompt: PromptRelance) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prompt ?')) return;
    try {
      setSavingId(prompt.id);
      await deletePromptRelance(prompt.id);
     
      const res = await fetchPromptsRelance(1, 50);
      setPromptsRelance(res.items || []);
    } catch (e) {
      console.error(e);
      setError('Erreur lors de la suppression');
    } finally {
      setSavingId(null);
    }
  };

  
  const forceStatsUpdate = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 100);
  };

  const stats = useMemo(() => {
    const toFr = (status?: string | null) => {
      if (!status) return 'En attente';
      const s = status.toLowerCase();
      if (s.includes('valid')) return 'Validé';
      if (s.includes('refus')) return 'Refusé';
      return 'En attente';
    };
    const mapped = items.map((r) => toFr(r.prospect_status));
    return {
      total: typeof total === 'number' ? total : items.length,
      enAttente: mapped.filter((s) => s === 'En attente').length,
      valides: mapped.filter((s) => s === 'Validé').length,
    };
  }, [items, total, refreshing]); 

  return (
    <Layout title="Gestion des mails de relance">
      <div className="space-y-6">
        {/* okk*/}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => setShowNewPromptModal(true)} className="gap-2 border-1">
            <Plus className="h-4 w-4" />
            Nouveau prompt
          </Button>
          
          <Button onClick={handleGenerateRelanceMails} className="gap-2 bg-gradient-primary border-1">
            <Bot className="h-4 w-4" />
            Générer relances IA
          </Button>
          

          
          <div className="ml-auto flex gap-2">
            <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
              Valider le groupe
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/*ok */}
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
        {loading && (
          <div className="text-sm text-muted-foreground">Chargement...</div>
        )}
        {refreshing && (
          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
            <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
            Rechargement des données...
          </div>
        )}
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        {successMessage && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
            {successMessage}
          </div>
        )}

        {/* yes*/}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mails">Mails de Relance</TabsTrigger>
            <TabsTrigger value="prompts">Prompts de Relance</TabsTrigger>
          </TabsList>

          {/* ohh */}
          <TabsContent value="mails" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Mails de Relance Générés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/*hi .*/}
                      {items.length === 0 && !loading && (
                        <div className="p-4 border border-dashed rounded-md text-sm text-muted-foreground">
                          Aucun mail à afficher.
                        </div>
                      )}
                      {items.map((row) => {
                        const statut = (() => {
                          
                          if (row.email_dispatched === true || (row.sent_at && row.sent_at !== null)) return 'Envoyé';
                          if (row.validated_by_admin === true) return 'Validé';
                          if (row.validated_by_admin === false) return 'Refusé';
                          return 'En attente';
                        })();
                        const toType = (ps?: string | null) => {
                          const s = (ps || '').toLowerCase();
                          if (s.includes('intéressé mais plus tard') || s.includes('interesse mais plus tard') || s.includes('intéressé plus tard')) return 'Intéressé plus tard';
                          if (s.includes('intéress')) return 'Intéressé';
                          if (s.includes('non') && s.includes('intéress')) return 'Non intéressé';
                          if (s.includes('aucun')) return 'Aucun rapport';
                          if (s.includes('non_class')) return 'Non classifié';
                          return 'Non réponse';
                        };
                        const mail = {
                          id: row.id,
                          destinataire: row.email,
                          sujet: row.subject,
                          contenu: row.message,
                          typeReponse: toType(row.prospect_status),
                          statut,
                          genereParIA: true,
                          dateGeneration: row.created_at?.slice(0, 10) || '',
                          mailOriginal: undefined,
                        } as any;
                        return (
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
                                className="h-6 px-2 border"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              
                              {(mail.statut === 'En attente' || mail.statut === 'Refusé') && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleValidateMail(mail)}
                                    className="h-6 px-2 border"
                                    disabled={savingId === mail.id}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleRejectMail(mail)}
                                    className="h-6 px-2 border"
                                    disabled={savingId === mail.id}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* yo */}
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
                        <h4 className="font-medium">{prompt.label}</h4>
                        <Badge className={getTypeColor((prompt.type_reponse || '').toLowerCase().includes('plus') ? 'Intéressé plus tard' : (prompt.type_reponse || '').toLowerCase().includes('intéress') ? 'Intéressé' : 'Non réponse')}>
                          {prompt.type_reponse}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {prompt.message_template}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Utilisé {prompt.use_count ?? 0} fois</span>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 border"
                            onClick={() => handleEditPrompt(prompt)}
                            disabled={savingId === prompt.id}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 border"
                            onClick={() => handleViewPrompt(prompt)}
                          >
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

        {/* hello*/}
        {selectedMail && (
          <Modal>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]">
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
          </Modal>
        )}

        {/* big */}
        {selectedPrompt && (
          <Modal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>
                    {editingPrompt ? 'Modifier le prompt' : 'Visualiser le prompt'}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getTypeColor((selectedPrompt.type_reponse || '').toLowerCase().includes('plus') ? 'Intéressé plus tard' : (selectedPrompt.type_reponse || '').toLowerCase().includes('intéress') ? 'Intéressé' : 'Non réponse')}>
                      {selectedPrompt.type_reponse}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Utilisé {selectedPrompt.use_count ?? 0} fois
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nom du prompt</label>
                    <input
                      type="text"
                      value={editedPromptLabel}
                      onChange={(e) => setEditedPromptLabel(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                      disabled={!editingPrompt}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Modèle de sujet</label>
                    <input
                      type="text"
                      value={editedPromptSubject}
                      onChange={(e) => setEditedPromptSubject(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                      disabled={!editingPrompt}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Modèle de message</label>
                    <Textarea
                      value={editedPromptMessage}
                      onChange={(e) => setEditedPromptMessage(e.target.value)}
                      className="mt-1 min-h-[200px]"
                      disabled={!editingPrompt}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    {editingPrompt && (
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDeletePrompt(selectedPrompt)}
                        disabled={savingId === selectedPrompt.id}
                      >
                        Supprimer
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setSelectedPrompt(null)}>
                      {editingPrompt ? 'Annuler' : 'Fermer'}
                    </Button>
                    {editingPrompt && (
                      <Button onClick={handleSavePrompt} disabled={savingId === selectedPrompt.id}>
                        Sauvegarder
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </Modal>
        )}

        {/* lit */}
        {showNewPromptModal && (
          <Modal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]">
              <Card className="w-full max-w-3xl">
                <CardHeader>
                  <CardTitle>Nouveau prompt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Nom du prompt</label>
                    <input
                      type="text"
                      value={newPromptLabel}
                      onChange={(e) => setNewPromptLabel(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                      placeholder="Ex: Relance client intéressé"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type de réponse</label>
                    <select
                      value={newPromptType}
                      onChange={(e) => setNewPromptType(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                    >
                      <option>Intéressé</option>
                      <option>Intéressé plus tard</option>
                      <option>Non réponse</option>
                      <option>Non intéressé</option>
                      <option>Aucun rapport</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Modèle de sujet</label>
                    <input
                      type="text"
                      value={newPromptSubject}
                      onChange={(e) => setNewPromptSubject(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                      placeholder="Ex: Suivi de votre demande"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Modèle de message</label>
                    <Textarea
                      value={newPromptMessage}
                      onChange={(e) => setNewPromptMessage(e.target.value)}
                      className="mt-1 min-h-[160px]"
                      placeholder="Ex: Cher client, nous avons bien reçu votre demande..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => {
                      setShowNewPromptModal(false);
                      setError(null);
                    }}>Annuler</Button>
                    <Button
                      onClick={async () => {
                        console.log('Validation des champs:', {
                          label: newPromptLabel,
                          type: newPromptType,
                          subject: newPromptSubject,
                          message: newPromptMessage
                        });
                        
                        if (!newPromptLabel?.trim() || !newPromptSubject?.trim() || !newPromptMessage?.trim()) {
                          setError('Veuillez remplir tous les champs (sans espaces vides)');
                          return;
                        }
                        
                        const payload = {
                          label: newPromptLabel.trim(),
                          type_reponse: newPromptType,
                          subject_template: newPromptSubject.trim(),
                          message_template: newPromptMessage.trim(),
                          active: true,
                        };
                        
                        console.log('Payload envoyé:', payload);
                        
                        try {
                          setCreatingPrompt(true);
                          setError(null); 
                          
                          console.log('Envoi de la requête de création...');
                          const result = await createPromptRelance(payload);
                          console.log('Résultat création prompt:', result);
                          
                          console.log('Rechargement des prompts...');
                          const res = await fetchPromptsRelance(1, 50);
                          console.log('Nouveaux prompts reçus:', res);
                          setPromptsRelance(res.items || []);
                          
                          
                          setTimeout(async () => {
                            try {
                              setRefreshing(true);
                              console.log('Rechargement forcé des prompts...');
                              const freshRes = await fetchPromptsRelance(1, 50);
                              console.log('Prompts frais reçus:', freshRes);
                              setPromptsRelance(freshRes.items || []);
                              forceStatsUpdate(); 
                            } catch (error) {
                              console.error('Erreur rechargement forcé prompts:', error);
                            } finally {
                              setRefreshing(false);
                            }
                          }, 1000);
                          
                          console.log('Fermeture de la modale...');
                          setShowNewPromptModal(false);
                          setNewPromptLabel('');
                          setNewPromptType('Non réponse');
                          setNewPromptSubject('');
                          setNewPromptMessage('');
                          
                          console.log('Création terminée avec succès');
                          setSuccessMessage('Prompt créé avec succès !');
                          setTimeout(() => setSuccessMessage(null), 3000);
                        } catch (e) {
                          console.error('Erreur création prompt:', e);
                          setError('Erreur lors de la création du prompt: ' + (e.message || 'Erreur inconnue'));
                        } finally {
                          setCreatingPrompt(false);
                        }
                      }}
                      disabled={creatingPrompt}
                    >
                      {creatingPrompt ? 'Création...' : 'Créer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Modal>
        )}

        {/*yaya */}
        {showGenerateIaModal && (
          <Modal>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000]">
              <Card className="w-full max-w-3xl">
                <CardHeader>
                  <CardTitle>Générer une relance IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium">Email destinataire</label>
                    <input
                      type="email"
                      value={genEmail}
                      onChange={(e) => setGenEmail(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                      placeholder="client@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sujet</label>
                    <input
                      type="text"
                      value={genSubject}
                      onChange={(e) => setGenSubject(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                      placeholder="Ex: Suivi de votre demande"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      value={genMessage}
                      onChange={(e) => setGenMessage(e.target.value)}
                      className="mt-1 min-h-[160px]"
                      placeholder="Ex: Cher client, nous avons bien reçu votre demande..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => {
                      setShowGenerateIaModal(false);
                      setError(null);
                    }}>Annuler</Button>
                    <Button
                      onClick={async () => {
                        if (!genEmail?.trim() || !genSubject?.trim() || !genMessage?.trim()) {
                          setError('Veuillez renseigner email, sujet et message (sans espaces vides)');
                          return;
                        }
                        try {
                          setCreatingMail(true);
                          setError(null);
                          
                          console.log('Envoi de la requête de création email...');
                          const result = await createAiEmailResponse({
                            email: genEmail.trim(),
                            subject: genSubject.trim(),
                            message: genMessage.trim(),
                          });
                          console.log('Résultat création email:', result);
                          
                          console.log('Rechargement des emails...');
                          const res = await fetchAiEmailResponses(page, 50);
                          console.log('Nouveaux emails reçus:', res);
                          setItems(res.items);
                          setTotal(res.total);
                          
                         
                          setTimeout(async () => {
                            try {
                              setRefreshing(true);
                              console.log('Rechargement forcé des emails...');
                              const freshRes = await fetchAiEmailResponses(page, 50);
                              console.log('Emails frais reçus:', freshRes);
                              setItems(freshRes.items);
                              setTotal(freshRes.total);
                              forceStatsUpdate(); 
                            } catch (error) {
                              console.error('Erreur rechargement forcé:', error);
                            } finally {
                              setRefreshing(false);
                            }
                          }, 1000);
                          
                          console.log('Fermeture de la modale...');
                          setShowGenerateIaModal(false);
                          setGenEmail('');
                          setGenSubject('');
                          setGenMessage('');
                          
                          console.log('Création email terminée avec succès');
                          setSuccessMessage('Email de relance créé avec succès !');
                          setTimeout(() => setSuccessMessage(null), 3000);
                        } catch (e) {
                          console.error('Erreur création mail:', e);
                          setError('Erreur lors de la création de la relance: ' + (e.message || 'Erreur inconnue'));
                        } finally {
                          setCreatingMail(false);
                        }
                      }}
                      disabled={creatingMail}
                    >
                      {creatingMail ? 'Génération...' : 'Générer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};

export default MailsRelance;