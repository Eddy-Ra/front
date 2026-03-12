import React, { useState, useEffect } from 'react';
import { Send, Play, Pause, History, AlertCircle, CheckCircle, Mail, List, Edit, Save, X } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';
import { set } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

interface B2b_manual {
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

interface historique {
  id: number;
  date: string;
  totalMails: number;
  envoyes: number;
  erreurs: number;
  statut: string;
  duree: string;
  details: string;
}
interface realtimestatus {
  id: number;
  created_at: string;
  email: string;
  statut: string;
  category: string;
  company: string;
  details?: string;
  is_to_display_now: boolean;
}



const EnvoiMasse = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(50);
  const [messagesCategories, setMessagesCategories] = useState<MessageCategory[]>([]);
  const [messagesCategoriesRelance, setMessagesCategoriesRelance] = useState<MessageCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory | null>(null);
  const [editingLimit, setEditingLimit] = useState<number | null>(null);
  const [tempLimit, setTempLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const [mailsGeneres, setMailsGeneres] = useState<MailGenere[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<B2b_manual[]>([]);
  const [historique, sethistorique] = useState<historique[]>([]);
  const [statusMails, setstatusMails] = useState<realtimestatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');



  const WEBHOOK_URL = 'https://n8n.omega-connect.tech/webhook/simulate-progress-n8n-v1';
  const WEBHOOK_URL_RELANCE = 'https://n8n.omega-connect.tech/webhook/simulate-progress-relance';



  //{ email: 'jean.dupont@entreprise.com', statut: 'Envoyé', timestamp: '09:32:15', category: 'Tech Startups' },


  const fetchRealTimeStatus = async () => {
    try {
      const res = await api.get("/realtimestatus");
      setstatusMails([...res.data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).reverse());


      return res.data;
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
      return [];
    }
  };


  const fetchHistory = async () => {
    try {
      const res = await api.get("/envoiemassehisto");
      sethistorique(res.data);
      return res.data;
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
      return [];
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await api.get("/b2b_manual");
      setContacts(res.data);
      return res.data;
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
      return [];
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      return res.data;
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
      return [];
    }
  };

  const fetchMailsGeneres = async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/mailsgeneres?_t=${timestamp}`);
      setMailsGeneres(res.data);
      setError(null);
      return res.data;
    } catch (err) {
      console.error('Erreur chargement mails générés:', err);
      setError('Erreur lors du chargement des mails générés');
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true); // Ensure loading is true at the start of data fetching
        fetchRealTimeStatus();
        fetchHistory(); // Added fetchHistory here

        // 1. Charger les données initiales en parallèle
        // 1. Charger les données initiales en parallèle
        const [contactsData, mailsData, categoriesData] = await Promise.all([
          fetchContacts(),
          fetchMailsGeneres(),
          fetchCategories()
        ]);

        const categoryMap = new Map();
        categoriesData.forEach((cat: any) => {
          categoryMap.set(cat.id, cat);
        });


        const mCD: MessageCategory[] = [];

        mailsData.forEach((mail: MailGenere) => {

          // 5. Utiliser la Map (Opération synchrone !) dans le .filter()
          const contactInfo: Contact[] = contactsData
            .filter((contact: B2b_manual) => {
              // Récupération SYNCHRONE du nom de la catégorie depuis la Map
              const contactCategory = categoryMap.get(contact.category_id);

              // Vérifie si la catégorie existe et si le nom correspond au mail
              return contactCategory && contactCategory.name === mail.categorie;
            })
            // Le .map() reste synchrone, il est correct
            .map((contact: B2b_manual) => ({
              id: contact.id,
              full_name: contact.full_name,
              email: contact.email,
              company: contact.company,
              // Optionnel: On peut maintenant inclure le nom de la catégorie résolu ici aussi
              category: categoryMap.get(contact.category_id)?.name || 'Inconnue'
            }));

          // Le reste de la logique de construction de mailInfo reste inchangé
          const mailInfo: MessageCategory = {
            id: mail.id,
            name: mail.categorie,
            messageTitle: mail.sujet,
            messageContent: mail.contenu,
            contacts: contactInfo,
            limit: contactInfo.length,
            isSending: false,
            progress: 0,
          };

          mCD.push(mailInfo);
        });

        setMessagesCategories(mCD);

        if (mCD.length > 0) {
          setSelectedCategory(mCD[0]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // ... (gestion des erreurs)
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStartSending = () => {
    setIsRunning(true);
  };

  const handlePauseSending = () => {
    setIsRunning(false);
  };

  const handleSendIndividual = async (contactId: number, categoryId: number) => {
    const category = messagesCategories.find(cat => cat.id === categoryId);
    const contact = category?.contacts.find(c => c.id === contactId);

    if (!category || !contact) {
      toast({
        title: "Erreur",
        description: "Contact ou catégorie introuvable",
        variant: "destructive",
      });
      return;
    }

    try {

      const identifiant_unique = `individual-${contact.id}-${Date.now()}`;
      const webhookUrl_realtime = "https://n8n.omega-connect.tech/webhook/realtime";

      // 1. Enregistrement en temps réel
      await api.post(webhookUrl_realtime, {
        contacts: [contact],
        contacts_len: 1,
        identifiant_unique: identifiant_unique
      });
      fetchRealTimeStatus();

      // 2. Envoi du mail via le workflow principal
      await api.post(WEBHOOK_URL, {
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
        },
        timestamp: new Date().toISOString(),
        identifiant_unique: identifiant_unique,
      });

      fetchRealTimeStatus();

      toast({
        title: "Envoi individuel lancé",
        description: `Email en cours d'envoi à ${contact.email}`,
      });
    } catch (error) {
      console.error('Erreur envoi individuel:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer l'email",
        variant: "destructive",
      });
    }
  };

  const handleSendCategoryBatch = async (categoryId: number) => {
    const category = messagesCategories.find(cat => cat.id === categoryId);

    if (!category) {
      toast({
        title: "Erreur",
        description: "Catégorie introuvable",
        variant: "destructive",
      });
      return;
    }

    // État initial : on démarre l’envoi
    setMessagesCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, isSending: true, progress: 0 } : cat
      )
    );

    // Compteur initial envoyé à n8n
    const identifiant_unique = `batch-${category.id}-${Date.now()}`
    let compteur = 0;
    const totalContacts = category.contacts.length;
    const webhookUrl_realtime = "https://n8n.omega-connect.tech/webhook/realtime";//prod
    //const webhookUrl_realtime = "https://n8n.omega-connect.tech/webhook-test/realtime";
    const reponse = await api.post(webhookUrl_realtime, {
      contacts: category.contacts,
      contacts_len: totalContacts,
      identifiant_unique: identifiant_unique
    });
    console.log(reponse.data);

    fetchRealTimeStatus();

    // Boucle sur tous les contacts
    const timestamp = new Date().toISOString()
    for (let i = 0; i < totalContacts; i++) {
      try {
        const contact = category.contacts[i];
        console.log(`📤 Lancement du webhook pour contact ${i + 1}/${totalContacts}`);

        // 🟢 Étape 1 : envoi au webhook N8N
        const response = await api.post(WEBHOOK_URL, {
          mode: "send_batch",
          category_id: category.id,
          category_name: category.name,
          message_title: category.messageTitle,
          message_content: category.messageContent,
          contact,
          limit: totalContacts,
          compteur: i, // On utilise l'index local
          timestamp: timestamp,
          identifiant_unique: identifiant_unique
        });

        // 🟢 Étape 2 : calcul et mise à jour de la progression
        const currentCount = i + 1;
        const progress = Math.min(
          Math.round((currentCount / totalContacts) * 100),
          100
        );

        // 🔹 Mise à jour du state React
        setMessagesCategories(prev =>
          prev.map(cat =>
            cat.id === categoryId
              ? { ...cat, progress, isSending: true } // On garde isSending à true ici
              : cat
          )
        );

        // 🔹 Notification de progression
        toast({
          title: `Progression ${progress}%`,
          description: `Contact ${i + 1}/${totalContacts} traité.`,
        });

        // 🕐 Petit délai pour lisser la charge serveur
        await new Promise(res => setTimeout(res, 300));

      } catch (error) {
        console.error("❌ Erreur d’envoi :", error);
        toast({
          title: "Erreur d’envoi",
          description: "Une erreur est survenue lors de l'envoi de certains messages.",
          variant: "destructive",
        });
        break; // on arrête la boucle en cas d’erreur
      }
      fetchRealTimeStatus();
    }
    fetchHistory();
    fetchRealTimeStatus();
    // Actualisation finale du statut en temps réel dans 16 minutes
    setTimeout(() => {
      fetchRealTimeStatus();
    }, 16 * 60 * 1000); // 15 minutes
    // ✅ Fin de boucle
    toast({
      title: "Envoi terminé",
      description: `Tous les contacts de la catégorie "${category.name}" ont été traités.`,
    });

    // Mise à jour finale
    setMessagesCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, isSending: false, progress: 100 }
          : cat
      )
    );
  };

  const handleSendAllCategories = async () => {
    const categoriesToSend = messagesCategories.filter(
      (cat) => cat.contacts.length > 0 && !cat.isSending
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
      description: `Lancement de l'envoi pour ${categoriesToSend.length} catégories.`,
    });

    try {
      // On lance tout en parallèle
      await Promise.all(
        categoriesToSend.map((cat) => handleSendCategoryBatch(cat.id))
      );

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





  const handleStartEditLimit = (categoryId: number, currentLimit: number) => {
    setEditingLimit(categoryId);
    setTempLimit(currentLimit.toString());
  };

  const handleSaveLimit = (categoryId: number) => {
    const newLimit = parseInt(tempLimit);
    if (!isNaN(newLimit) && newLimit > 0) {
      setMessagesCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? { ...cat, limit: newLimit } : cat
        )
      );
      toast({
        title: "Limite mise à jour",
        description: `Nouvelle limite: ${newLimit} emails`,
      });
    }
    setEditingLimit(null);
    setTempLimit('');
  };

  const handleCancelEdit = () => {
    setEditingLimit(null);
    setTempLimit('');
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'Envoyé':
        return 'text-green-600';
      case 'En cours':
        return 'text-yellow-600';
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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'En cours':
        return <div className="h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />;
      case 'Erreur':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

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

        <Tabs defaultValue="utilisateurs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="utilisateurs">Envoie en masse</TabsTrigger>
            <TabsTrigger value="parametres">Envoie en masse relance</TabsTrigger>
          </TabsList>


          <div className="h-4" />
          <TabsContent value="utilisateurs" className="mt-6">

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Messages par Catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-64 pr-4">

                    {messagesCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className={`p-3 border rounded-lg w-[383px] cursor-pointer transition-colors mb-2 ${selectedCategory.id === cat.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                          }`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate">{cat.name} ({cat.contacts.length} contacts)</span>
                          <div className="flex items-center gap-2">
                            {editingLimit === cat.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={tempLimit}
                                  onChange={(e) => setTempLimit(e.target.value)}
                                  className="w-16 h-6 text-xs"
                                  min="1"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveLimit(cat.id);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-green-600 hover:text-white"
                                  onClick={() => handleSaveLimit(cat.id)}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="font-normal">
                                  Max: {cat.limit}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditLimit(cat.id, cat.limit);
                                  }}
                                  disabled={isRunning || cat.isSending || loading}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate italic w-[350px]">
                          Sujet: {cat.messageTitle}
                        </p>
                        <div className="mt-2">
                          {cat.isSending ? (
                            <Progress value={cat.progress} className="h-2" />
                          ) : (
                            <Button
                              size="sm"
                              className="w-full h-8 gap-1"
                              onClick={(e) => { e.stopPropagation(); handleSendCategoryBatch(cat.id); }}
                              disabled={isRunning || cat.isSending || cat.contacts.length === 0 || loading}
                            >
                              <Play className="h-3 w-3" />
                              Envoyer en lot ({cat.contacts.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="pt-2 border-t mt-2">
                    <Button
                      variant="default"
                      className="w-full gap-2 bg-primary hover:bg-primary/90"
                      onClick={handleSendAllCategories}
                      disabled={isRunning || loading || messagesCategories.every(cat => cat.isSending || cat.contacts.length === 0)}
                    >
                      <Send className="h-4 w-4" />
                      Envoyer toutes les catégories
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Détails de l'Envoi: {selectedCategory.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-lg bg-secondary/20">
                    <p className="font-semibold mb-1 truncate">Sujet: {selectedCategory.messageTitle}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{selectedCategory.messageContent}</p>
                  </div>

                  <h3 className="text-md font-semibold mt-4">Contacts à cibler ({selectedCategory.contacts.length})</h3>
                  <div className="my-2">
                    <Input
                      placeholder="Rechercher un contact..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-48 pr-4">
                    <div className="space-y-2">
                      {selectedCategory.contacts
                        .filter(contact =>
                          (contact.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (contact.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (contact.company || '').toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((contact) => (
                          <div key={contact.id} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">{contact.full_name} ({contact.company})</p>
                              <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 ml-2 flex-shrink-0 gap-1"
                              onClick={() => handleSendIndividual(contact.id, selectedCategory.id)}
                              disabled={isRunning || selectedCategory.isSending || loading}
                            >
                              <Send className="h-3 w-3" />
                              1 par 1
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="h-4" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statuts en temps réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80 pr-4">
                    <div className="space-y-3">
                      {statusMails.map((mail, index) => (
                        (mail.is_to_display_now == true) ? <div key={index} className="flex flex-col p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
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
                            {mail.created_at !== '-' && (
                              <span className="text-muted-foreground ml-auto">{mail.created_at}</span>
                            )}
                          </div>
                        </div> : <></>
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
                      {historique.map((envoi) => (
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
                            <strong>Détails</strong>: {envoi.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Durée: {envoi.duree}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="parametres" className="mt-6">

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Messages par Catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-64 pr-4">

                    {messagesCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className={`p-3 border rounded-lg w-[383px] cursor-pointer transition-colors mb-2 ${selectedCategory.id === cat.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
                          }`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate">{cat.name} ({cat.contacts.length} contacts)</span>
                          <div className="flex items-center gap-2">
                            {editingLimit === cat.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={tempLimit}
                                  onChange={(e) => setTempLimit(e.target.value)}
                                  className="w-16 h-6 text-xs"
                                  min="1"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveLimit(cat.id);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-green-600 hover:text-white"
                                  onClick={() => handleSaveLimit(cat.id)}
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={handleCancelEdit}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="font-normal">
                                  Max: {cat.limit}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-primary hover:text-primary-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditLimit(cat.id, cat.limit);
                                  }}
                                  disabled={isRunning || cat.isSending || loading}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate italic w-[350px]">
                          Sujet: {cat.messageTitle}
                        </p>
                        <div className="mt-2">
                          {cat.isSending ? (
                            <Progress value={cat.progress} className="h-2" />
                          ) : (
                            <Button
                              size="sm"
                              className="w-full h-8 gap-1"
                              onClick={(e) => { e.stopPropagation(); handleSendCategoryBatch(cat.id); }}
                              disabled={isRunning || cat.isSending || cat.contacts.length === 0 || loading}
                            >
                              <Play className="h-3 w-3" />
                              Envoyer en lot ({cat.contacts.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                  <div className="pt-2 border-t mt-2">
                    <Button
                      variant="default"
                      className="w-full gap-2 bg-primary hover:bg-primary/90"
                      onClick={handleSendAllCategories}
                      disabled={isRunning || loading || messagesCategories.every(cat => cat.isSending || cat.contacts.length === 0)}
                    >
                      <Send className="h-4 w-4" />
                      Envoyer toutes les catégories
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Détails de l'Envoi: {selectedCategory.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-lg bg-secondary/20">
                    <p className="font-semibold mb-1 truncate">Sujet: {selectedCategory.messageTitle}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{selectedCategory.messageContent}</p>
                  </div>

                  <h3 className="text-md font-semibold mt-4">Contacts à cibler ({selectedCategory.contacts.length})</h3>
                  <ScrollArea className="h-48 pr-4">
                    <div className="space-y-2">
                      {selectedCategory.contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-2 border rounded-md">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{contact.full_name} ({contact.company})</p>
                            <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 ml-2 flex-shrink-0 gap-1"
                            onClick={() => handleSendIndividual(contact.id, selectedCategory.id)}
                            disabled={isRunning || selectedCategory.isSending || loading}
                          >
                            <Send className="h-3 w-3" />
                            1 par 1
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="h-4" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statuts en temps réel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80 pr-4">
                    <div className="space-y-3">
                      {statusMails.map((mail, index) => (
                        (mail.is_to_display_now == true) ? <div key={index} className="flex flex-col p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
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
                            {mail.created_at !== '-' && (
                              <span className="text-muted-foreground ml-auto">{mail.created_at}</span>
                            )}
                          </div>
                        </div> : <></>
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
                      {historique.map((envoi) => (
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
                            <strong>Détails</strong>: {envoi.details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Durée: {envoi.duree}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </Layout>
  );
};

export default EnvoiMasse;
