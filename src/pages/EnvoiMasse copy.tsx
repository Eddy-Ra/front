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
  prompt_id: number; // ID du prompt utilisé pour générer ce mail
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





// SECTION: Données Mockées pour la Gestion des Catégories


const mCD = [
  {
    name: 'Tech Startups',
    messageTitle: 'Opportunités de Partenariat Tech',
    messageContent: 'Bonjour [NOM], nous avons des solutions innovantes pour votre startup tech...',
    contacts: [
      { id: 101, full_name: 'Jean Dupont', email: 'jean.d@tech.com', company: 'InnovTech', category: 'Tech Startups' },
      { id: 102, full_name: 'Marie Curie', email: 'marie.c@solut.io', company: 'SolutIO', category: 'Tech Startups' },
      { id: 103, full_name: 'Alex Smith', email: 'alex.s@code.net', company: 'CodeFlow', category: 'Tech Startups' },
    ],
    limit: 150, 
    isSending: false,
    progress: 0,
  },
  {
    name: 'Finance & Conseils',
    messageTitle: 'Rapport Annuel d\'Analyse Financière',
    messageContent: 'Cher [NOM], veuillez trouver ci-joint notre rapport exclusif sur le secteur financier...',
    contacts: [
      { id: 201, full_name: 'Pierre Bernard', email: 'pierre.b@finance.fr', company: 'FinCorp', category: 'Finance & Conseils' },
      { id: 202, full_name: 'Sophie Martin', email: 'sophie.m@advice.com', company: 'GlobalAdvice', category: 'Finance & Conseils' },
    ],
    limit: 100,
    isSending: false,
    progress: 0,
  },
  {
    name: 'Restauration',
    messageTitle: 'Offre Spéciale Équipements de Cuisine',
    messageContent: 'Bonjour, nous avons une offre unique sur nos équipements de cuisine professionnels pour [COMPANY]...',
    contacts: [
      { id: 301, full_name: 'Lucas Roux', email: 'lucas.r@food.net', company: 'Le Gourmet', category: 'Restauration' },
    ],
    limit: 50,
    isSending: false,
    progress: 0,
  },
];

const EnvoiMasse = () => {
  useEffect(() => {
  
  fetchMailsGeneres()
  for (let i = 0; i < mailsGeneres.length; i++) {
    const element = mailsGeneres[i];
      setmockCategoriesData(function() {

      })
    }
  }, []);
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [batchSize, setBatchSize] = useState(50);
  const [messagesCategories, setMessagesCategories] = useState();
  const [selectedCategory, setSelectedCategory] = useState();
  const [editingLimit, setEditingLimit] = useState<number | null>(null);
  const [tempLimit, setTempLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [mailsGeneres, setMailsGeneres] = useState<MailGenere[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]); // Utilisé si nécessaire ailleurs
  const [mockCategoriesData, setmockCategoriesData] = useState<any[]>([mCD]); // Utilisé si nécessaire ailleurs
  
  
  
  
  
  const fetchContacts = async () => {
      try {
        const res = await api.get("/b2b_manual");
        setContacts(res.data);
      } catch (err) {
        console.error("Erreur chargement contacts:", err);
      }
    };
  const fetchCatById = async (id) => {
      try {
        const res = await api.get("/categories/"+id);
        return res.data;
      } catch (err) {
        console.error("Erreur chargement contacts:", err);
      }
    };
    
  // --- Charger les mails générés ---
    const fetchMailsGeneres = async () => {
      try {
        const timestamp = new Date().getTime();
        const res = await api.get(`/mailsgeneres?_t=${timestamp}`);
        setMailsGeneres(res.data);
        setError(null);
      } catch (err) {
        console.error('Erreur chargement mails générés:', err);
        setError('Erreur lors du chargement des mails générés');
      }
    };

  useEffect(() => {
      const loadData = async () => {
        fetchContacts();
      }
      loadData();
    }, []);
  console.log('Contacts chargés:', contacts);
  
  
  // URL du webhook N8N
  const WEBHOOK_URL = 'https://wfw.omega-connect.tech/webhook-test/1aad8c3f-b7cc-455e-bfa6-f2fbf8c1ffcgeneratemessage';

  // SECTION: Données mockées de l'envoi en cours (Global)
  const currentSending = {
    totalMails: 1247,
    mailsEnvoyes: 327,
    mailsEnAttente: 920,
    erreurs: 3,
    tempsEcoule: '00:15:42',
    tempsEstime: '01:23:15'
  };

  // SECTION: Historique des envois (détails)
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

  // SECTION: Statuts d'envoi en temps réel (détails)
  const [statusMails] = useState([
    { email: 'jean.dupont@entreprise.com', statut: 'Envoyé', timestamp: '09:32:15', category: 'Tech Startups' },
    { email: 'marie.martin@commerce.fr', statut: 'Envoyé', timestamp: '09:32:14', category: 'Tech Startups' },
    { email: 'pierre.bernard@services.com', statut: 'En cours', timestamp: '09:32:13', category: 'Finance & Conseils' },
    { email: 'sophie.leroy@startup.io', statut: 'En attente', timestamp: '-', category: 'Finance & Conseils' },
    { email: 'contact@invalide.xx', statut: 'Erreur', timestamp: '09:32:10', category: 'Tech Startups', details: 'Adresse inconnue' }
  ]);

  // --- Fonctions de gestion de l'envoi avec N8N ---

  const handleStartSending = () => {
    setIsRunning(true);
    // ... (Logique réelle d'appel à l'API/n8n pour lancer l'envoi global)
  };

  const handlePauseSending = () => {
    setIsRunning(false);
    // ... (Logique réelle d'appel à l'API/n8n pour mettre en pause)
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

    setMessagesCategories(prev => 
      prev.map(cat => cat.id === categoryId ? { ...cat, isSending: true, progress: 0 } : cat)
    );

    try {
      setLoading(true);
      
      await api.post(WEBHOOK_URL, {
        mode: 'send_batch',
        category_id: category.id,
        category_name: category.name,
        message_title: category.messageTitle,
        message_content: category.messageContent,
        contacts: category.contacts,
        limit: category.limit,
        total_contacts: category.contacts.length,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Envoi en lot lancé",
        description: `${category.contacts.length} emails en cours d'envoi pour ${category.name}`,
      });

      // Simuler la progression (à remplacer par un vrai suivi si disponible)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setMessagesCategories(prev =>
          prev.map(cat =>
            cat.id === categoryId ? { ...cat, progress: Math.min(progress, 100) } : cat
          )
        );
        
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setMessagesCategories(prev =>
              prev.map(cat =>
                cat.id === categoryId ? { ...cat, isSending: false, progress: 0 } : cat
              )
            );
          }, 1000);
        }
      }, 2000);

    } catch (error) {
      console.error('Erreur envoi en lot pour la catégorie:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible de lancer l'envoi en lot",
        variant: "destructive",
      });
      
      setMessagesCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? { ...cat, isSending: false, progress: 0 } : cat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Fonctions pour la modification de la limite ---

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

  // --- Fonctions d'aide ---

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

  // --- RENDU ---

  return (
    <Layout title="Envoi en masse">
      <div className="space-y-6">
        <div className="h-4" />

        {/* SECTION 2: Messages, Catégories & Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Liste des Catégories de Messages */}
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
                    className={`p-3 border rounded-lg cursor-pointer transition-colors mb-2 ${
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
                    <p className="text-xs text-muted-foreground mt-1 truncate italic">
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

          {/* Détails de la Catégorie et Liste de Contacts */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Détails de l'Envoi: {selectedCategory.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Message */}
                <div className="p-3 border rounded-lg bg-secondary/20">
                    <p className="font-semibold mb-1 truncate">Sujet: {selectedCategory.messageTitle}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{selectedCategory.messageContent}</p>
                </div>

                {/* Liste des Contacts */}
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

        {/* SECTION 3: Statuts et Historique */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Statuts d'envoi en temps réel */}
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

          {/* Historique des envois */}
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
