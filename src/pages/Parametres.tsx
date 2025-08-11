import React, { useState } from 'react';
import { Users, Settings, Mail, Key, Plus, Edit, Trash2, Shield, User } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

const Parametres = () => {
  // SECTION: Données mockées des utilisateurs
  const [utilisateurs] = useState([
    {
      id: 1,
      nom: 'Admin Principal',
      email: 'admin@crm.com',
      role: 'Admin',
      statut: 'Actif',
      dernierAcces: '2024-01-15 14:30',
      dateCreation: '2024-01-01'
    },
    {
      id: 2,
      nom: 'Marie Rédactrice',
      email: 'marie.redac@crm.com',
      role: 'Rédacteur',
      statut: 'Actif',
      dernierAcces: '2024-01-15 09:15',
      dateCreation: '2024-01-05'
    },
    {
      id: 3,
      nom: 'Jean Validateur',
      email: 'jean.valid@crm.com',
      role: 'Rédacteur',
      statut: 'Inactif',
      dernierAcces: '2024-01-10 16:45',
      dateCreation: '2024-01-03'
    }
  ]);

  // SECTION: Paramètres généraux
  const [parametresGeneraux, setParametresGeneraux] = useState({
    emailDefaut: 'crm@entreprise.com',
    nomExpediteur: 'Auto-prospect',
    frequenceEnvoi: 50,
    delaiEntreLots: 5,
    autoValidation: false,
    notificationsEmail: true,
    sauvegardeAuto: true,
    apiKeyN8n: 'n8n_key_example_123...'
  });

  const [nouvelUtilisateur, setNouvelUtilisateur] = useState({
    nom: '',
    email: '',
    role: 'Rédacteur'
  });

  const [showAddUser, setShowAddUser] = useState(false);

  const handleAddUser = () => {
    console.log('Ajouter utilisateur:', nouvelUtilisateur);
    setShowAddUser(false);
    setNouvelUtilisateur({ nom: '', email: '', role: 'Rédacteur' });
  };

  const handleEditUser = (user: any) => {
    console.log('Modifier utilisateur:', user);
  };

  const handleDeleteUser = (user: any) => {
    console.log('Supprimer utilisateur:', user);
  };

  const handleSaveSettings = () => {
    console.log('Sauvegarder paramètres:', parametresGeneraux);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Badge className="bg-primary text-primary-foreground">Admin</Badge>;
      case 'Rédacteur':
        return <Badge variant="secondary">Rédacteur</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Actif':
        return <Badge className="bg-success text-success-foreground">Actif</Badge>;
      case 'Inactif':
        return <Badge variant="destructive">Inactif</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <Layout title="Paramètres & Gestion utilisateur">
      <div className="space-y-6">
        <Tabs defaultValue="utilisateurs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="utilisateurs">Gestion des Utilisateurs</TabsTrigger>
            <TabsTrigger value="parametres">Paramètres Généraux</TabsTrigger>
          </TabsList>

          {/* SECTION: Onglet Gestion des utilisateurs */}
          <TabsContent value="utilisateurs" className="mt-6">
            <div className="space-y-6">
              {/* Actions principales */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Gestion des Utilisateurs</h3>
                <Button onClick={() => setShowAddUser(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un utilisateur
                </Button>
              </div>

              {/* Liste des utilisateurs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Utilisateurs ({utilisateurs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {utilisateurs.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{user.nom}</h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Dernier accès: {user.dernierAcces}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user.statut)}
                          
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.role !== 'Admin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rôles et permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Rôles et Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary text-primary-foreground">Admin</Badge>
                        <h4 className="font-medium">Administrateur</h4>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Accès complet à toutes les fonctionnalités</li>
                        <li>• Gestion des utilisateurs</li>
                        <li>• Configuration des paramètres système</li>
                        <li>• Validation et envoi des mails</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Rédacteur</Badge>
                        <h4 className="font-medium">Rédacteur</h4>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Création et édition des prompts</li>
                        <li>• Génération de mails avec IA</li>
                        <li>• Gestion des contacts</li>
                        <li>• Lecture seule sur les statistiques</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SECTION: Onglet Paramètres généraux */}
          <TabsContent value="parametres" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Email */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Configuration Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email-defaut">Email expéditeur par défaut</Label>
                      <Input
                        id="email-defaut"
                        type="email"
                        value={parametresGeneraux.emailDefaut}
                        onChange={(e) => setParametresGeneraux(prev => ({
                          ...prev,
                          emailDefaut: e.target.value
                        }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="nom-expediteur">Nom de l'expéditeur</Label>
                      <Input
                        id="nom-expediteur"
                        value={parametresGeneraux.nomExpediteur}
                        onChange={(e) => setParametresGeneraux(prev => ({
                          ...prev,
                          nomExpediteur: e.target.value
                        }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="frequence">Fréquence d'envoi (mails par lot)</Label>
                      <Input
                        id="frequence"
                        type="number"
                        min="10"
                        max="100"
                        value={parametresGeneraux.frequenceEnvoi}
                        onChange={(e) => setParametresGeneraux(prev => ({
                          ...prev,
                          frequenceEnvoi: Number(e.target.value)
                        }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="delai">Délai entre les lots (minutes)</Label>
                      <Input
                        id="delai"
                        type="number"
                        min="1"
                        max="60"
                        value={parametresGeneraux.delaiEntreLots}
                        onChange={(e) => setParametresGeneraux(prev => ({
                          ...prev,
                          delaiEntreLots: Number(e.target.value)
                        }))}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Paramètres Système */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Paramètres Système
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-validation des mails IA</Label>
                        <p className="text-sm text-muted-foreground">
                          Valider automatiquement les mails générés par IA
                        </p>
                      </div>
                      <Switch
                        checked={parametresGeneraux.autoValidation}
                        onCheckedChange={(checked) => setParametresGeneraux(prev => ({
                          ...prev,
                          autoValidation: checked
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notifications par email</Label>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des notifications pour les réponses
                        </p>
                      </div>
                      <Switch
                        checked={parametresGeneraux.notificationsEmail}
                        onCheckedChange={(checked) => setParametresGeneraux(prev => ({
                          ...prev,
                          notificationsEmail: checked
                        }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sauvegarde automatique</Label>
                        <p className="text-sm text-muted-foreground">
                          Sauvegarder automatiquement les modifications
                        </p>
                      </div>
                      <Switch
                        checked={parametresGeneraux.sauvegardeAuto}
                        onCheckedChange={(checked) => setParametresGeneraux(prev => ({
                          ...prev,
                          sauvegardeAuto: checked
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Intégrations */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Intégrations & API
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="api-n8n">Clé API n8n (prévu pour automatisation)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="api-n8n"
                          type="password"
                          value={parametresGeneraux.apiKeyN8n}
                          onChange={(e) => setParametresGeneraux(prev => ({
                            ...prev,
                            apiKeyN8n: e.target.value
                          }))}
                          placeholder="Entrez votre clé API n8n"
                        />
                        <Button variant="outline">Tester</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cette intégration permettra l'automatisation des envois via n8n
                      </p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Statut des intégrations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Serveur SMTP</span>
                          <Badge className="bg-success text-success-foreground">Connecté</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Base de données</span>
                          <Badge className="bg-success text-success-foreground">Opérationnelle</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>n8n</span>
                          <Badge variant="secondary">En attente</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} className="gap-2">
                  <Settings className="h-4 w-4" />
                  Sauvegarder les paramètres
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* SECTION: Modal d'ajout d'utilisateur */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Ajouter un utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="new-nom">Nom complet</Label>
                  <Input
                    id="new-nom"
                    value={nouvelUtilisateur.nom}
                    onChange={(e) => setNouvelUtilisateur(prev => ({
                      ...prev,
                      nom: e.target.value
                    }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={nouvelUtilisateur.email}
                    onChange={(e) => setNouvelUtilisateur(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="new-role">Rôle</Label>
                  <select
                    id="new-role"
                    value={nouvelUtilisateur.role}
                    onChange={(e) => setNouvelUtilisateur(prev => ({
                      ...prev,
                      role: e.target.value
                    }))}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                  >
                    <option value="Rédacteur">Rédacteur</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddUser}>
                    Ajouter
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

export default Parametres;