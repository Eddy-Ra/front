import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Play, History, AlertCircle, CheckCircle, Mail, List, Edit, Save, X } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// ─── Interfaces ───────────────────────────────────────────────────────────────

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

interface B2b_datasynch {
  id: number;
  full_name: string;
  email: string;
  company: string;
  source: string;
  created_at: string;
  updated_at?: string;
  generateMessage: boolean;
  category_id: string;
}

interface Contact {
  id: number;
  full_name: string;
  email: string;
  company: string;
  category: string;
}

interface MessageCategory {
  id: number;
  name: string;
  messageTitle: string;
  messageContent: string;
  contacts: Contact[];
  limit: number;
  isSending: boolean;
  progress: number;
}

interface Historique {
  id: number;
  date: string;
  totalMails: number;
  envoyes: number;
  erreurs: number;
  statut: string;
  duree: string;
  details: string;
}

interface RealtimeStatus {
  id: number;
  created_at: string;
  email: string;
  statut: string;
  category: string;
  company: string;
  details?: string;
  is_to_display_now: boolean;
}

// ─── Helper : formate une durée en ms → "Xm Xs" ──────────────────────────────
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
};

// ─── Helper : parse la réponse du webhook ─────────────────────────────────────
const parseWebhookResponse = (data: unknown): { success: boolean; message: string; details?: string } => {
  if (!data) return { success: false, message: "Aucune réponse du serveur" };

  const item = Array.isArray(data) ? (data as Record<string, unknown>[])[0] : data as Record<string, unknown>;

  const rawSuccess = item?.success;
  const success =
    rawSuccess === true ||
    rawSuccess === "True" ||
    rawSuccess === "true" ||
    item?.status === 'success' ||
    item?.status === 'sent' ||
    item?.status === 'ok' ||
    item?.statut === 'Envoyé' ||
    item?.sent === true;

  const message =
    (item?.message as string) ||
    (item?.details as string) ||
    (item?.description as string) ||
    (item?.error as string) ||
    (success ? "Email envoyé avec succès" : "Erreur lors de l'envoi");

  const details = (item?.email as string) || (item?.destinataire as string) || (item?.to as string) || undefined;

  return { success, message, details };
};


// ─── Composant principal ──────────────────────────────────────────────────────

const EnvoiMasse = () => {
  const [isRunning, setIsRunning]                         = useState(false);
  const [messagesCategories, setMessagesCategories]       = useState<MessageCategory[]>([]);
  const [selectedCategory, setSelectedCategory]           = useState<MessageCategory | null>(null);
  const [editingLimit, setEditingLimit]                   = useState<number | null>(null);
  const [tempLimit, setTempLimit]                         = useState('');
  const [loading, setLoading]                             = useState(true);
  const [historique, setHistorique]                       = useState<Historique[]>([]);
  const [statusMails, setStatusMails]                     = useState<RealtimeStatus[]>([]);
  const [searchQuery, setSearchQuery]                     = useState('');

  // Refs polling & tracking
  const pollingIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSendingAnyRef     = useRef(false);
  const sendStartTimesRef   = useRef<Record<string, number>>({});
  const batchTrackingRef    = useRef<Record<string, {
    total: number;
    resolved: number;
    envoyes: number;
    erreurs: number;
    categoryId: number;
  }>>({});

  const WEBHOOK_URL        = 'https://n8n.projets-omega.net/webhook/simulate-progress';
  //const WEBHOOK_REALTIME   = 'https://n8n.projets-omega.net/webhook/realtime';


  // ─── fetchRealTimeStatus ────────────────────────────────────────────────────
  const fetchRealTimeStatus = useCallback(async () => {
    try {
      const res = await api.get("/realtimestatus");
      const sorted: RealtimeStatus[] = [...res.data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setStatusMails(sorted);

      // Vérifier si des batches en cours sont terminés
      const tracking = batchTrackingRef.current;
      for (const uid of Object.keys(tracking)) {
        const batch = tracking[uid];
        if (batch.resolved >= batch.total) continue;

        const startTime = sendStartTimesRef.current[uid];
        if (!startTime) continue;

        const finalStatuses = sorted.filter(s => {
          const t = new Date(s.created_at).getTime();
          return t >= startTime && (s.statut === 'Envoyé' || s.statut === 'Erreur');
        });

        const newEnvoyes  = finalStatuses.filter(s => s.statut === 'Envoyé').length;
        const newErreurs  = finalStatuses.filter(s => s.statut === 'Erreur').length;
        const newResolved = newEnvoyes + newErreurs;

        tracking[uid] = { ...batch, resolved: newResolved, envoyes: newEnvoyes, erreurs: newErreurs };

        if (newResolved >= batch.total) {
          const durationStr = formatDuration(Date.now() - startTime);

          const newEntry: Historique = {
            id: Date.now(),
            date: new Date().toLocaleString('fr-FR'),
            totalMails: batch.total,
            envoyes: newEnvoyes,
            erreurs: newErreurs,
            statut: newErreurs === 0 ? 'Terminé' : 'Partiel',
            duree: durationStr,
            details: `Envoi batch — ${newEnvoyes} succès, ${newErreurs} erreur(s)`,
          };

          setHistorique(prev => [newEntry, ...prev]);
          delete tracking[uid];
          delete sendStartTimesRef.current[uid];
        }
      }

      return sorted;
    } catch (err) {
      console.error("Erreur chargement statuts:", err);
      return [];
    }
  }, []);


  // ─── fetchHistory ───────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get("/envoiemassehisto");
      setHistorique(res.data);
      return res.data;
    } catch (err) {
      console.error("Erreur chargement historique:", err);
      return [];
    }
  }, []);


  // ─── Polling ────────────────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = setInterval(async () => {
      await fetchRealTimeStatus();
    }, 3000);
  }, [fetchRealTimeStatus]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);


  // ─── Chargement initial ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchRealTimeStatus();
        await fetchHistory();

        const [contactsData, mailsData] = await Promise.all([
          api.get("/b2b_datasynch").then(r => {
            console.log("Données des contacts récupérées :", r.data);
            return r.data as B2b_datasynch[];
          }),
          api.get("/mailsgeneres").then(r => {
            console.log("Données des mails générés récupérées :", r.data);
            return r.data as MailGenere[];
          }),
        ]);

        if (!contactsData || contactsData.length === 0) {
          toast({
            title: "Aucun contact trouvé",
            description: "L'API n'a retourné aucun contact. Veuillez vérifier les données.",
            variant: "warning",
          });
          setMessagesCategories([]);
          setSelectedCategory(null);
          return;
        }

        // ✅ Mapping explicite B2b_datasynch → Contact
        const contactsMapped: Contact[] = contactsData.map(c => ({
          id: c.id,
          full_name: c.full_name || "Nom inconnu",
          email: c.email || "Email inconnu",
          company: c.company || "Entreprise inconnue",
          category: c.category_id || "Catégorie inconnue",
        }));

        const mCD: MessageCategory[] = mailsData.map(mail => ({
          id: mail.id,
          name: mail.categorie || "Catégorie inconnue",
          messageTitle: mail.sujet || "Titre inconnu",
          messageContent: mail.contenu || "Contenu non disponible",
          contacts: contactsMapped,
          limit: contactsMapped.length,
          isSending: false,
          progress: 0,
        }));

        setMessagesCategories(mCD);
        if (mCD.length > 0) setSelectedCategory(mCD[0]);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données. Veuillez vérifier les API et réessayer.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchRealTimeStatus, fetchHistory]);


  // ─── Envoi individuel ───────────────────────────────────────────────────────
  const handleSendIndividual = async (contactId: number, categoryId: number) => {
    const category = messagesCategories.find(cat => cat.id === categoryId);
    const contact  = category?.contacts.find(c => c.id === contactId);

    if (!category || !contact) {
      toast({ title: "Erreur", description: "Contact ou catégorie introuvable", variant: "destructive" });
      return;
    }

    const identifiant_unique = `individual-${contact.id}-${Date.now()}`;
    const startTime = Date.now();
    sendStartTimesRef.current[identifiant_unique] = startTime;

    batchTrackingRef.current[identifiant_unique] = {
      total: 1, resolved: 0, envoyes: 0, erreurs: 0, categoryId: category.id,
    };

    startPolling();

    try {
      toast({ title: "Lancement d'envoi à", description: contact.full_name });

      // 1️⃣ Enregistrement realtime AVANT l'envoi
     /* await api.post(WEBHOOK_REALTIME, {
        time: 0,
        email: contact.email,
        detail: "enregistrement",
        contacts: {
          id: contact.id,
          full_name: contact.full_name,
          email: contact.email,
          company: contact.company,
          category_societe: contact.category,
          identifiant_unique,
        },
        contacts_len: 1,
        identifiant_unique,
        timestamp: new Date().toISOString(),
      });*/

      await fetchRealTimeStatus();

      // 2️⃣ Envoi principal
      const response = await api.post(WEBHOOK_URL, {
        mode: 'send_individual',
        category_id: category.id,
        category_name: category.name,
        message_title: category.messageTitle,
        message_content: category.messageContent,
        contact: {
          id: contact.id,
          full_name: contact.full_name,
          email: contact.email,
          company: contact.company,
          category_societe: contact.category,
        },
        timestamp: new Date().toISOString(),
        identifiant_unique,
        time: 0,
        detail: "enregistrement",
        contacts_len: 1,
      });

      await fetchRealTimeStatus();

      // 3️⃣ Parser la réponse via helper commun
      const { success, message, details } = parseWebhookResponse(response.data);

      toast({
        title: success ? "✅ Email envoyé" : "❌ Échec de l'envoi",
        description: details ? `${message} → ${details}` : message,
        variant: success ? "default" : "destructive",
      });

    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; response?: { status?: number; data?: { message?: string } } };

      // Distinguer timeout (email peut avoir quand même été envoyé) d'une vraie erreur
      const isTimeout =
        err?.code === 'ECONNABORTED' ||
        err?.message?.includes('timeout') ||
        err?.response?.status === 504;

      if (isTimeout) {
        toast({
          title: "⚠️ Réponse lente",
          description: "L'email a probablement été envoyé, vérifiez le statut dans quelques secondes.",
          variant: "default",
        });
      } else {
        console.error('Erreur envoi individuel:', error);
        toast({
          title: "Erreur d'envoi",
          description: err?.response?.data?.message ?? "Impossible d'envoyer l'email",
          variant: "destructive",
        });
      }
    } finally {
      setTimeout(async () => {
        await fetchRealTimeStatus();
        stopPolling();
      }, 5000);
    }
  };


  // ─── Envoi par lot ──────────────────────────────────────────────────────────
  const handleSendCategoryBatch = async (categoryId: number) => {
    const category = messagesCategories.find(cat => cat.id === categoryId);

    if (!category) {
      toast({ title: "Erreur", description: "Catégorie introuvable", variant: "destructive" });
      return;
    }

    setMessagesCategories(prev =>
      prev.map(cat => cat.id === categoryId ? { ...cat, isSending: true, progress: 0 } : cat)
    );

    const identifiant_unique  = `batch-${category.id}-${Date.now()}`;
    const contactsToSend      = category.contacts.slice(0, category.limit);
    const totalContacts       = contactsToSend.length;
    const startTime           = Date.now();

    sendStartTimesRef.current[identifiant_unique] = startTime;
    batchTrackingRef.current[identifiant_unique]  = {
      total: totalContacts, resolved: 0, envoyes: 0, erreurs: 0, categoryId: category.id,
    };

    startPolling();
    isSendingAnyRef.current = true;

    try {
      // Enregistrement realtime du batch
      /*await api.post(WEBHOOK_REALTIME, {
        contacts: contactsToSend,
        contacts_len: totalContacts,
        detail: "enregistrement",
        identifiant_unique,
        timestamp: new Date().toISOString(),
      });*/

      await fetchRealTimeStatus();

      const timestamp = new Date().toISOString();

      for (let i = 0; i < totalContacts; i++) {
        try {
          const contact = contactsToSend[i];
          console.log(`📤 Contact ${i + 1}/${totalContacts} — ${contact.email}`);

          const response = await api.post(WEBHOOK_URL, {
           
              category_id: category.id,
              category_name: category.name,
              message_title: category.messageTitle,
              message_content: category.messageContent,
              identifiant_unique,
              time: 0,
              detail: "enregistrement",
              contacts_len: 1,    
              mode: "send_batch",
              contact,
              limit: totalContacts,
              compteur: i,
              timestamp,
            
          });

          const progress = Math.min(Math.round(((i + 1) / totalContacts) * 100), 100);
          setMessagesCategories(prev =>
            prev.map(cat => cat.id === categoryId ? { ...cat, progress, isSending: true } : cat)
          );

          await fetchRealTimeStatus();
          
          toast({
            title: `Progression ${progress}%`,
            description: `Contact ${i + 1}/${totalContacts} traité.`,
          });

          // Petit délai pour ne pas saturer le webhook
          await new Promise(res => setTimeout(res, 300));

        } catch (err) {
          console.error(`❌ Erreur contact ${i + 1}:`, err);
          toast({
            title: "Erreur d'envoi",
            description: "Une erreur est survenue lors de l'envoi de certains messages.",
            variant: "destructive",
          });
          break;
        }
        
      }
    } finally {
      await fetchRealTimeStatus();
      await fetchHistory();

      setTimeout(async () => {
        await fetchRealTimeStatus();
        await fetchHistory();
      }, 10000);

      isSendingAnyRef.current = false;
      stopPolling();

      toast({
        title: "Envoi terminé",
        description: `Tous les contacts de "${category.name}" ont été traités.`,
      });

      setMessagesCategories(prev =>
        prev.map(cat => cat.id === categoryId ? { ...cat, isSending: false, progress: 100 } : cat)
      );
    }
  };


  // ─── Envoi toutes catégories ────────────────────────────────────────────────
  const handleSendAllCategories = async () => {
    const categoriesToSend = messagesCategories.filter(
      cat => cat.contacts.length > 0 && !cat.isSending
    );

    if (categoriesToSend.length === 0) {
      toast({
        title: "Information",
        description: "Aucune catégorie à envoyer (pas de contacts ou envoi déjà en cours)",
      });
      return;
    }

    setIsRunning(true);
    toast({
      title: "Envoi groupé global",
      description: `Lancement de l'envoi pour ${categoriesToSend.length} catégorie(s).`,
    });

    try {
      await Promise.all(categoriesToSend.map(cat => handleSendCategoryBatch(cat.id)));
      toast({
        title: "Tous les envois sont terminés",
        description: "Le processus d'envoi pour toutes les catégories sélectionnées est fini.",
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi groupé:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de certaines catégories.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };


  // ─── Gestion limite ─────────────────────────────────────────────────────────
  const handleStartEditLimit = (categoryId: number, currentLimit: number) => {
    setEditingLimit(categoryId);
    setTempLimit(currentLimit.toString());
  };

  const handleSaveLimit = (categoryId: number) => {
    const newLimit = parseInt(tempLimit, 10);
    if (!isNaN(newLimit) && newLimit > 0) {
      setMessagesCategories(prev =>
        prev.map(cat => cat.id === categoryId ? { ...cat, limit: newLimit } : cat)
      );
      toast({ title: "Limite mise à jour", description: `Nouvelle limite : ${newLimit} emails` });
    }
    setEditingLimit(null);
    setTempLimit('');
  };

  const handleCancelEdit = () => {
    setEditingLimit(null);
    setTempLimit('');
  };


  // ─── Helpers UI ─────────────────────────────────────────────────────────────
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Envoyé':     return 'text-green-600';
      case 'En cours':   return 'text-yellow-600';
      case 'En attente': return 'text-muted-foreground';
      case 'Erreur':     return 'text-destructive';
      default:           return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Envoyé':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'En cours':
        return <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />;
      case 'Erreur':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };


  // ─── CategoryList ────────────────────────────────────────────────────────────
  const renderCategoryList = () => (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Messages par Catégorie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-64 pr-4">
          {messagesCategories.map(cat => (
            <div
              key={cat.id}
              className={`p-3 border rounded-lg w-[383px] cursor-pointer transition-colors mb-2 ${
                selectedCategory?.id === cat.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
              }`}
              onClick={() => {
                setSelectedCategory(cat);
                setSearchQuery(''); // ✅ Reset search when switching categories
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold truncate">{cat.name} ({cat.contacts.length} contacts)</span>
                <div className="flex items-center gap-2">
                  {editingLimit === cat.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={tempLimit}
                        onChange={e => setTempLimit(e.target.value)}
                        className="w-16 h-6 text-xs"
                        min="1"
                        onKeyDown={e => {
                          if (e.key === 'Enter')  handleSaveLimit(cat.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-green-600 hover:text-white" onClick={() => handleSaveLimit(cat.id)}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground" onClick={handleCancelEdit}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="font-normal">Max : {cat.limit}</Badge>
                      <Button
                        size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                        onClick={e => { e.stopPropagation(); handleStartEditLimit(cat.id, cat.limit); }}
                        disabled={isRunning || cat.isSending || loading}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate italic w-[350px]">
                Sujet : {cat.messageTitle}
              </p>
              <div className="mt-2">
                {cat.isSending ? (
                  <Progress value={cat.progress} className="h-2" />
                ) : (
                  <Button
                    size="sm" className="w-full h-8 gap-1"
                    onClick={e => { e.stopPropagation(); handleSendCategoryBatch(cat.id); }}
                    disabled={isRunning || cat.isSending || cat.contacts.length === 0 || loading}
                  >
                    <Play className="h-3 w-3" />
                    Envoyer en lot ({cat.limit})
                  </Button>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="pt-2 border-t mt-2">
          <Button
            variant="default" className="w-full gap-2 bg-primary hover:bg-primary/90"
            onClick={handleSendAllCategories}
            disabled={isRunning || loading || messagesCategories.every(cat => cat.isSending || cat.contacts.length === 0)}
          >
            <Send className="h-4 w-4" />
            Envoyer toutes les catégories
          </Button>
        </div>
      </CardContent>
    </Card>
  );


  // ─── StatusAndHistory ────────────────────────────────────────────────────────
  const renderStatusAndHistory = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Statuts en temps réel
            {pollingIntervalRef.current && (
              <span className="ml-2 flex items-center gap-1 text-xs text-yellow-600 font-normal">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                Synchronisation...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-3">
              {statusMails
                .filter(mail => mail.is_to_display_now === true)
                .map((mail, index) => (
                  <div key={index} className="flex flex-col p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getStatusIcon(mail.statut)}
                        <span className="text-sm font-medium truncate">{mail.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="font-normal">{mail.category}</Badge>
                        <span className={getStatusColor(mail.statut)}>{mail.statut}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1 pl-7">
                      {mail.details && <span className="text-destructive italic">{mail.details}</span>}
                      {mail.created_at && mail.created_at !== '-' && (
                        <span className="text-muted-foreground ml-auto">{mail.created_at}</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des envois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 pr-4">
            <div className="space-y-4">
              {historique.map(envoi => (
                <div key={envoi.id} className="p-4 border border-border rounded-lg bg-card hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{envoi.date}</span>
                    <Badge
                      variant={envoi.statut === 'Terminé' ? 'default' : 'destructive'}
                      className={envoi.statut === 'Terminé' ? 'bg-green-600 text-white' : ''}
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
                      <p className="font-medium text-green-600">{envoi.envoyes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Erreurs</p>
                      <p className="font-medium text-destructive">{envoi.erreurs}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
                    <strong>Détails</strong> : {envoi.details}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Durée : {envoi.duree}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );


  // ─── ContactList (partagé entre les deux tabs) ────────────────────────────────
  const renderContactListPanel = ({ withSearch }: { withSearch: boolean }) => {
    // Process filtering with safe optional chaining and lowercase fallback
    const q = searchQuery.toLowerCase().trim();
    
    // Pour des raisons de performance (éviter que l'UI se fige lors d'une recherche avec des milliers d'éléments),
    // nous filtrons et limitons l'affichage aux 100 premiers résultats.
    const filteredAndSliced = (selectedCategory?.contacts ?? [])
      .filter(contact => {
        if (!withSearch) return true;
        if (!q) return true;
        
        return (
          (contact.full_name ?? '').toLowerCase().includes(q) ||
          (contact.email    ?? '').toLowerCase().includes(q) ||
          (contact.company  ?? '').toLowerCase().includes(q)
        );
      })
      .slice(0, 100);

    return (
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Détails de l'Envoi : {selectedCategory?.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-lg bg-secondary/20">
            <p className="font-semibold mb-1 truncate">Sujet : {selectedCategory?.messageTitle}</p>
            <p className="text-sm text-muted-foreground line-clamp-2">{selectedCategory?.messageContent}</p>
          </div>

          <h3 className="text-md font-semibold mt-4">
            Contacts à cibler ({selectedCategory?.contacts.length ?? 0})
          </h3>

          {withSearch && (
            <div className="my-2">
              <Input
                placeholder="Rechercher un contact..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <ScrollArea className="h-48 pr-4">
            <div className="space-y-2">
              {filteredAndSliced.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun contact trouvé.</p>
              ) : (
                filteredAndSliced.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{contact.full_name} ({contact.company})</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                    <Button
                      size="sm" variant="outline" className="h-7 ml-2 flex-shrink-0 gap-1"
                      onClick={() => selectedCategory && handleSendIndividual(contact.id, selectedCategory.id)}
                      disabled={isRunning || (selectedCategory?.isSending ?? false) || loading}
                    >
                      <Send className="h-3 w-3" />
                      1 par 1
                    </Button>
                  </div>
                ))
              )}
            </div>
            {filteredAndSliced.length === 100 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                ⚠️ Affichage limité aux 100 premiers résultats pour préserver les performances. Utilisez la recherche.
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };


  // ─── Rendu ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout title="Envoi en masse">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des catégories...</p>
        </div>
      </Layout>
    );
  }

  if (!selectedCategory) {
    return (
      <Layout title="Envoi en masse">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Aucune catégorie trouvée ou aucun mail généré.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Envoi en masse">
      <div className="space-y-6">
        <Tabs defaultValue="envoiMasse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="envoiMasse">Envoi en masse</TabsTrigger>
            <TabsTrigger value="envoiRelance">Envoi en masse — relance</TabsTrigger>
          </TabsList>

          <div className="h-4" />

          {/* ===== TAB 1 ===== */}
          <TabsContent value="envoiMasse" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {renderCategoryList()}
              {renderContactListPanel({ withSearch: true })}
            </div>
            <div className="h-4" />
            {renderStatusAndHistory()}
          </TabsContent>

          {/* ===== TAB 2 ===== */}
          <TabsContent value="envoiRelance" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {renderCategoryList()}
              {renderContactListPanel({ withSearch: false })}
            </div>
            <div className="h-4" />
            {renderStatusAndHistory()}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EnvoiMasse;