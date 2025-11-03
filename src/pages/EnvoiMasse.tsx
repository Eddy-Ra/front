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

const EnvoiMasse = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(50);
  const [messagesCategories, setMessagesCategories] = useState<MessageCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory | null>(null);
  const [editingLimit, setEditingLimit] = useState<number | null>(null);
  const [tempLimit, setTempLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [mailsGeneres, setMailsGeneres] = useState<MailGenere[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<B2b_manual[]>([]);
  //const [historique, sethistorique] = useState(0);
  


  //const WEBHOOK_URL = 'https://wfw.omega-connect.tech/webhook-test/1aad8c3f-b7cc-455e-bfa6-f2fbf8c1ffcgeneratemessage';
  //const WEBHOOK_URL = 'https://wfw.omega-connect.tech/webhook-test/simulate-progress';
  const WEBHOOK_URL = 'https://wfw.omega-connect.tech/webhook/simulate-progress';

  // {
  //     id: 1,
  //     date: '2024-01-15 09:30',
  //     totalMails: 850,
  //     envoyes: 847,
  //     erreurs: 3,
  //     statut: 'Terminé',
  //     duree: '1h 23min',
  //     details: 'Tech Startups (300/300), Finance (250/250), Erreurs: 3 adresses non valides.'
  //   },

  const [historique] = useState([
    {
      id: 1,
      date: '2024-01-15 09:30',
      totalMails: 850,
      envoyes: 847,
      erreurs: 3,
      statut: 'Terminé',
      duree: '1h 23min',
      details: 'Tech Startups (300/300), Finance (250/250), Erreurs: 3 adresses non valides.'
    },
    {
      id: 2,
      date: '2024-01-14 14:15',
      totalMails: 650,
      envoyes: 650,
      erreurs: 0,
      statut: 'Terminé',
      duree: '58min',
      details: 'Restauration (100/100), Voyages (550/550). 100% de succès.'
    },
    {
      id: 3,
      date: '2024-01-13 10:00',
      totalMails: 420,
      envoyes: 415,
      erreurs: 5,
      statut: 'Terminé avec erreurs',
      duree: '42min',
      details: 'Services (415/420). 5 erreurs de connexion SMTP.'
    }
  ]);

  //{ email: 'jean.dupont@entreprise.com', statut: 'Envoyé', timestamp: '09:32:15', category: 'Tech Startups' },
  const [statusMails] = useState([
    { email: 'jean.dupont@entreprise.com', statut: 'Envoyé', timestamp: '09:32:15', category: 'Tech Startups' },
    { email: 'marie.martin@commerce.fr', statut: 'Envoyé', timestamp: '09:32:14', category: 'Tech Startups' },
    { email: 'pierre.bernard@services.com', statut: 'En cours', timestamp: '09:32:13', category: 'Finance & Conseils' },
    { email: 'sophie.leroy@startup.io', statut: 'En attente', timestamp: '-', category: 'Finance & Conseils' },
    { email: 'contact@invalide.xx', statut: 'Erreur', timestamp: '09:32:10', category: 'Tech Startups', details: 'Adresse inconnue' }
  ]);

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

  const fetchCatById = async (id: string) => {
    try {
      const res = await api.get("/categories/" + id);
      return res.data;
    } catch (err) {
      console.error("Erreur chargement catégorie:", err);
      return null;
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
        setLoading(true);

        // 1. Charger les données initiales en parallèle
        const [contactsData, mailsData] = await Promise.all([
          fetchContacts(),
          fetchMailsGeneres()
        ]);
        
        // --- NOUVEAUTÉ : PRÉCHARGEMENT DES CATÉGORIES ---
        
        // 2. Identifier tous les IDs de catégorie uniques nécessaires
        const categoryIds = Array.from(new Set(contactsData.map(c => c.category_id)));

        // 3. Charger TOUTES les catégories requises en parallèle
        // Map chaque ID à une Promise de catégorie et utilise Promise.all()
        const categoryPromises = categoryIds.map(id => fetchCatById(id));
        const categoriesResolved = await Promise.all(categoryPromises);

        // 4. Créer une Map pour un lookup rapide (ID -> Objet Catégorie)
        const categoryMap = new Map();
        categoriesResolved.forEach(cat => {
            // cat est l'objet résolu: { id: ..., name: "Hôtellerie & Tourisme", ... }
            categoryMap.set(cat.id, cat); 
        });

        // --- FIN DU PRÉCHARGEMENT ---

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
      setLoading(true);
      
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
      });

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
    } finally {
      setLoading(false);
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
  let compteur = 0;
  const totalContacts = category.contacts.length;

  // Boucle sur tous les contacts
  for (let i = 0; i < totalContacts; i++) {
    try {
      setLoading(true);
      const contact = category.contacts[i];

      console.log(`📤 Lancement du webhook pour contact ${i + 1}/${totalContacts}`);

      // 🟢 Étape 1 : envoi au webhook N8N
      const response = await api.post(WEBHOOK_URL, {
        mode: "send_batch",
        category_id: category.id,
        category_name: category.name,
        message_title: category.messageTitle,
        message_content: category.messageContent,
        contact, // un seul contact par itération
        limit: totalContacts, // valeur max pour le workflow
        compteur, // compteur actuel
        timestamp: new Date().toISOString(),
      });

      // 🟢 Étape 2 : on attend la réponse de N8N (Respond to Webhook1)
      const data = response.data;
      console.log("Réponse N8N :", data);

      // 🔹 Mise à jour du compteur (renvoyé par N8N)
      compteur = data.compteur + 1;

      // 🔹 Calcul de la progression
      const progress = Math.min(
        Math.round((compteur / totalContacts) * 100),
        100
      );

      // 🔹 Mise à jour du state React
      setMessagesCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, progress, isSending: progress < 100 }
            : cat
        )
      );

      // 🔹 Notification de progression
      toast({
        title: `Progression ${progress}%`,
        description: `Contact ${i + 1}/${totalContacts} traité (${data.status})`,
      });

      // 🕐 Petit délai pour lisser la charge serveur
      await new Promise(res => setTimeout(res, 300));

      // 🛑 Si le workflow renvoie "stop", on sort
      if (data.status === "stop") {
        console.log("🛑 Workflow terminé selon N8N");
        break;
      }
    } catch (error) {
      console.error("❌ Erreur d’envoi :", error);
      toast({
        title: "Erreur d’envoi",
        description: "Impossible de lancer l’envoi en lot",
        variant: "destructive",
      });
      break; // on arrête la boucle en cas d’erreur
    } finally {
      setLoading(false);
    }
  }

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

  if (!selectedCategory) {
    return (
      <Layout title="Envoi en masse">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des catégories...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Envoi en masse">
      <div className="space-y-6">
        <div className="h-4" />

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
                    className={`p-3 border rounded-lg w-[383px] cursor-pointer transition-colors mb-2 ${
                      selectedCategory.id === cat.id ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'
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
                          {mail.timestamp !== '-' && (
                              <span className="text-muted-foreground ml-auto">{mail.timestamp}</span>
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
      </div>
    </Layout>
  );
};

export default EnvoiMasse;
