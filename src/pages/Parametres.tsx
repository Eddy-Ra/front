import React, { useState, useEffect, ChangeEvent } from 'react';
import { Users, Settings, Mail, Key, Plus, Edit, Trash2, Shield, User, Loader2, Save, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import axios, { AxiosError } from 'axios';

axios.defaults.withCredentials = true;

// Interfaces pour types TypeScript
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Settings {
  emailDefaut: string;
  nomExpediteur: string;
  frequenceEnvoi: number;
  delaiEntreLots: number;
  autoValidation: boolean;
  notificationsEmail: boolean;
  sauvegardeAuto: boolean;
  apiKeyN8n: string;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
}

const Parametres: React.FC = () => {
  const [utilisateurs, setUtilisateurs] = useState<User[]>([]);
  const [parametresGeneraux, setParametresGeneraux] = useState<Settings>({
    emailDefaut: 'no-reply@omega-connect.tech',
    nomExpediteur: 'OmegaBrain',
    frequenceEnvoi: 50,
    delaiEntreLots: 5,
    autoValidation: false,
    notificationsEmail: true,
    sauvegardeAuto: true,
    apiKeyN8n: 'n8n_key_example_123...',
  });
  const [nouvelUtilisateur, setNouvelUtilisateur] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'Rédacteur',
  });
  const [userToEdit, setUserToEdit] = useState<number | null>(null);  // User à éditer
  const [verificationPassword, setVerificationPassword] = useState<string>('');  // Password pour vérif édition
  const [isEditVerified, setIsEditVerified] = useState<boolean>(false);  // État vérif
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [showEditUser, setShowEditUser] = useState<boolean>(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState<boolean>(false);  // Dialog vérif password
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showVerificationPassword, setShowVerificationPassword] = useState<boolean>(false);  // Toggle pour vérif password

  const apiUrl = import.meta.env.VITE_API_URL;  // https://www.autoprospectionadmin.omega-connect.tech/public
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }
    // Initialisez CSRF
    axios.get(`${apiUrl}/sanctum/csrf-cookie`).then(() => {
      fetchUsers();
      fetchSettings();
    }).catch((err) => {
      console.error('Erreur CSRF:', err);
      setError('Erreur d\'initialisation CSRF');
    });
  }, [token]);

  const fetchUsers = async (): Promise<void> => {
    try {
      const response = await axios.get<User[]>(`${apiUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUtilisateurs(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Erreur de chargement des utilisateurs');
    }
  };

  const fetchSettings = async (): Promise<void> => {
    try {
      const response = await axios.get<Settings>(`${apiUrl}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setParametresGeneraux(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres:', err);
      setError('Erreur de chargement des paramètres');
    }
  };

  const handleUpdateSettings = async (updatedSettings: Settings): Promise<void> => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.put<Settings>(`${apiUrl}/api/settings`, updatedSettings, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      setParametresGeneraux(response.data);
      setSuccess('Paramètres mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError(err.response?.data?.message as string || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (): Promise<void> => {
    if (!nouvelUtilisateur.name || !nouvelUtilisateur.email) {
      setError('Nom et email sont requis.');
      return;
    }
    if (nouvelUtilisateur.password && nouvelUtilisateur.password !== nouvelUtilisateur.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    const payload: NewUser = { ...nouvelUtilisateur };
    if (!payload.password) {
      payload.password = '';
      payload.password_confirmation = '';
    }

    try {
      await axios.post<User>(`${apiUrl}/api/users`, payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      setShowAddUser(false);
      setNouvelUtilisateur({ name: '', email: '', password: '', password_confirmation: '', role: 'Rédacteur' });
      fetchUsers();
      setError('');
      setSuccess('Utilisateur ajouté avec succès !');
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
      const errorMessage = err.response?.data?.message as string || 
                           (err.response?.data?.errors ? Object.values(err.response.data.errors as Record<string, string[]>).flat().join(', ') : 'Erreur lors de l\'ajout');
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: number): Promise<void> => {
    try {
      await axios.delete(`${apiUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      fetchUsers();
      setError('');
      setSuccess('Utilisateur supprimé avec succès !');
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Ouvrir dialog vérif password pour édition
  const openEditVerification = (userId: number): void => {
    setUserToEdit(userId);
    setVerificationPassword('');
    setShowVerificationDialog(true);
    setError('');
  };

  // Vérifier password pour déverrouiller édition
  const verifyEditPassword = async (): Promise<void> => {
    if (!verificationPassword) {
      setError('Mot de passe requis.');
      return;
    }
    try {
      const response = await axios.post<{ verified: boolean }>(`${apiUrl}/api/users/${userToEdit}/verify-password`, { password: verificationPassword }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      if (response.data.verified) {
        setIsEditVerified(true);
        setShowVerificationDialog(false);
        await loadUserForEdit(userToEdit as number);
        setShowEditUser(true);
        setError('');
      } else {
        setError('Mot de passe incorrect pour cet utilisateur.');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification:', err);
      setError('Erreur lors de la vérification du mot de passe');
    }
  };

  // Charger user pour édition (après vérif)
  const loadUserForEdit = async (userId: number): Promise<void> => {
    try {
      const response = await axios.get<User>(`${apiUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setNouvelUtilisateur({
        name: response.data.name,
        email: response.data.email,
        password: '',
        password_confirmation: '',
        role: response.data.role || 'Rédacteur',
      });
    } catch (err) {
      console.error('Erreur chargement user:', err);
      setError('Erreur lors du chargement de l\'utilisateur');
    }
  };

  // Sauvegarder édition
  const handleEditUser = async (): Promise<void> => {
    if (nouvelUtilisateur.password && nouvelUtilisateur.password !== nouvelUtilisateur.password_confirmation) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      await axios.put<User>(`${apiUrl}/api/users/${userToEdit}`, nouvelUtilisateur, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      setShowEditUser(false);
      setNouvelUtilisateur({ name: '', email: '', password: '', password_confirmation: '', role: 'Rédacteur' });
      fetchUsers();
      setError('');
      setSuccess('Utilisateur modifié avec succès !');
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      setError(err.response?.data?.message as string || 'Erreur lors de la modification');
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNouvelUtilisateur(prev => ({ ...prev, name: e.target.value }));
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNouvelUtilisateur(prev => ({ ...prev, email: e.target.value }));
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNouvelUtilisateur(prev => ({ ...prev, password: e.target.value }));
  };

  const handlePasswordConfirmationChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNouvelUtilisateur(prev => ({ ...prev, password_confirmation: e.target.value }));
  };

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setNouvelUtilisateur(prev => ({ ...prev, role: e.target.value }));
  };

  const handleVerificationPasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setVerificationPassword(e.target.value);
  };

  return (
    <Layout title="parametres">
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-md">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-md">
            <p className="text-green-400">{success}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-muted-foreground">Gérez les utilisateurs et les configurations.</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="settings">Paramètres Généraux</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Liste des utilisateurs</CardTitle>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Gérez les accès à l'application.</p>
                  <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un utilisateur</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-name">Nom complet</Label>
                          <Input
                            id="new-name"
                            value={nouvelUtilisateur.name}
                            onChange={handleNameChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-email">Email</Label>
                          <Input
                            id="new-email"
                            type="email"
                            value={nouvelUtilisateur.email}
                            onChange={handleEmailChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-password">Mot de passe (optionnel pour génération auto)</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPassword ? 'text' : 'password'}
                              value={nouvelUtilisateur.password}
                              onChange={handlePasswordChange}
                              placeholder="Laissez vide pour générer un random"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 h-4 w-4 opacity-70 hover:opacity-100"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="new-password-confirmation">Confirmer le mot de passe</Label>
                          <div className="relative">
                            <Input
                              id="new-password-confirmation"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={nouvelUtilisateur.password_confirmation}
                              onChange={handlePasswordConfirmationChange}
                              placeholder="Confirmez si changé"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 h-4 w-4 opacity-70 hover:opacity-100"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="new-role">Rôle</Label>
                          <select
                            id="new-role"
                            value={nouvelUtilisateur.role}
                            onChange={handleRoleChange}
                            className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                          >
                            <option value="Rédacteur">Rédacteur</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddUser(false)}>
                            Annuler
                          </Button>
                          <Button onClick={handleAddUser} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Ajouter
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {utilisateurs.length === 0 ? (
                    <p className="text-muted-foreground">Aucun utilisateur trouvé.</p>
                  ) : (
                    utilisateurs.map((user: User) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="secondary">{user.role}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditVerification(user.id)}>
                            <Edit className="mr-1 h-4 w-4" /> Éditer
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Supprimer
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dialog Vérif Password Édition */}
          <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vérification pour édition</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Entrez le mot de passe de l'utilisateur à modifier pour confirmer.</p>
                <div>
                  <Label htmlFor="verification-password">Mot de passe de l'utilisateur</Label>
                  <div className="relative">
                    <Input
                      id="verification-password"
                      type={showVerificationPassword ? 'text' : 'password'}
                      value={verificationPassword}
                      onChange={handleVerificationPasswordChange}
                      placeholder="Mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                      className="absolute right-3 top-3 h-4 w-4 opacity-70 hover:opacity-100"
                    >
                      {showVerificationPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowVerificationDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={verifyEditPassword} disabled={!verificationPassword || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Vérifier
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog Édition User (après vérif) */}
          <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nom complet</Label>
                  <Input
                    id="edit-name"
                    value={nouvelUtilisateur.name}
                    onChange={handleNameChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={nouvelUtilisateur.email}
                    onChange={handleEmailChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? 'text' : 'password'}
                      value={nouvelUtilisateur.password}
                      onChange={handlePasswordChange}
                      placeholder="Laissez vide pour garder l'actuel"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-4 w-4 opacity-70 hover:opacity-100"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-password-confirmation">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="edit-password-confirmation"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={nouvelUtilisateur.password_confirmation}
                      onChange={handlePasswordConfirmationChange}
                      placeholder="Confirmez si changé"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 h-4 w-4 opacity-70 hover:opacity-100"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-role">Rôle</Label>
                  <select
                    id="edit-role"
                    value={nouvelUtilisateur.role}
                    onChange={handleRoleChange}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md"
                  >
                    <option value="Rédacteur">Rédacteur</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditUser(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleEditUser} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Modifier
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Généraux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emailDefaut">Email par défaut</Label>
                    <Input
                      id="emailDefaut"
                      value={parametresGeneraux.emailDefaut}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setParametresGeneraux(prev => ({ ...prev, emailDefaut: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomExpediteur">Nom de l'expéditeur</Label>
                    <Input
                      id="nomExpediteur"
                      value={parametresGeneraux.nomExpediteur}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setParametresGeneraux(prev => ({ ...prev, nomExpediteur: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequenceEnvoi">Fréquence d'envoi (mails/heure)</Label>
                    <Input
                      id="frequenceEnvoi"
                      type="number"
                      value={parametresGeneraux.frequenceEnvoi}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setParametresGeneraux(prev => ({ ...prev, frequenceEnvoi: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delaiEntreLots">Délai entre lots (secondes)</Label>
                    <Input
                      id="delaiEntreLots"
                      type="number"
                      value={parametresGeneraux.delaiEntreLots}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setParametresGeneraux(prev => ({ ...prev, delaiEntreLots: parseInt(e.target.value) || 5 }))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Auto-validation
                    </Label>
                    <Switch
                      checked={parametresGeneraux.autoValidation}
                      onCheckedChange={(checked: boolean) => setParametresGeneraux(prev => ({ ...prev, autoValidation: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Notifications par email
                    </Label>
                    <Switch
                      checked={parametresGeneraux.notificationsEmail}
                      onCheckedChange={(checked: boolean) => setParametresGeneraux(prev => ({ ...prev, notificationsEmail: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Save className="h-4 w-4" /> Sauvegarde automatique
                    </Label>
                    <Switch
                      checked={parametresGeneraux.sauvegardeAuto}
                      onCheckedChange={(checked: boolean) => setParametresGeneraux(prev => ({ ...prev, sauvegardeAuto: checked }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKeyN8n">Clé API n8n</Label>
                  <Input
                    id="apiKeyN8n"
                    type="password"
                    value={parametresGeneraux.apiKeyN8n}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setParametresGeneraux(prev => ({ ...prev, apiKeyN8n: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={() => handleUpdateSettings(parametresGeneraux)}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder les changements
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Parametres;