import React, { useState, useEffect } from 'react';
import { Plus, Download, Upload, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE } from '@/lib/api';

const API_BASE_URL = `${API_BASE}/api`;

let csrfReadyForContacts = false;
async function ensureCsrfForContacts(): Promise<void> {
  if (csrfReadyForContacts) return;
  await axios.get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true });
  csrfReadyForContacts = true;
}

interface Categorie {
  id: number;
  nom: string;
  couleur: string;
  contacts_count?: number;
}

interface Contact {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  source: string;
  categorie_id: number | null;
  categorie?: Categorie;
  statut: string;
  date_ajout: string;
}

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [sourceStats, setSourceStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    source: 'Manuel',
    categorie_id: '',
    statut: 'Nouveau',
  });

  const columns = [
    { key: 'prenom', label: 'Prénom', sortable: true },
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'source', label: 'Source', sortable: true, filterable: true },
    {
      key: 'categorie_nom',
      label: 'Catégorie',
      sortable: true,
      filterable: true,
      render: (_: any, row: Contact) => row.categorie?.nom || 'Non catégorisé'
    },
    { key: 'statut', label: 'Statut', sortable: true, filterable: true },
    { key: 'date_ajout', label: 'Date d\'ajout', sortable: true },
  ];

  const filters = [
    {
      key: 'source',
      label: 'Source',
      options: ['Google Maps', 'Phantombuster', 'Manuel', 'Site web'],
    },
    {
      key: 'statut',
      label: 'Statut',
      options: ['Nouveau', 'Contacté', 'Intéressé', 'Non intéressé', 'Intéressé plus tard'],
    },
    {
      key: 'categorie_nom',
      label: 'Catégorie',
      options: [...new Set(categories.map((cat) => cat.nom))].concat(['Non catégorisé']), // Évite duplicates dans filters
    },
  ];

  useEffect(() => {
    fetchContacts();
    fetchCategories();
    fetchSourceStats();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      await ensureCsrfForContacts();
      const response = await axios.get(`${API_BASE_URL}/contacts`, { timeout: 5000, withCredentials: true });
      setContacts(response.data || []);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des contacts';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching contacts:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      await ensureCsrfForContacts();
      const response = await axios.get(`${API_BASE_URL}/categories`, { timeout: 5000, withCredentials: true });
      const categoriesData = response.data || [];
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !formData.categorie_id) {
        setFormData((prev) => ({ ...prev, categorie_id: categoriesData[0].id.toString() }));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des catégories';
      toast.error(errorMessage);
      console.error('Error fetching categories:', err.response?.data || err.message);
    }
  };

  const fetchSourceStats = async () => {
    try {
      await ensureCsrfForContacts();
      const response = await axios.get(`${API_BASE_URL}/source-stats`, { timeout: 5000, withCredentials: true });
      setSourceStats(response.data || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des statistiques';
      toast.error(errorMessage);
      console.error('Error fetching stats:', err.response?.data || err.message);
    }
  };

  const handleAddContact = () => {
    setCurrentContact(null);
    setFormData({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      source: 'Manuel',
      categorie_id: categories.length > 0 ? categories[0].id.toString() : 'none', // Utilise 'none' pour aucun
      statut: 'Nouveau',
    });
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setCurrentContact(contact);
    setFormData({
      prenom: contact.prenom || '',
      nom: contact.nom,
      email: contact.email,
      telephone: contact.telephone,
      source: contact.source,
      categorie_id: contact.categorie_id?.toString() || 'none',
      statut: contact.statut,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiData = {
        ...formData,
        categorie_id: formData.categorie_id === 'none' ? null : parseInt(formData.categorie_id),
      };

      if (currentContact) {
        await ensureCsrfForContacts();
        const response = await axios.put(`${API_BASE_URL}/contacts/${currentContact.id}`, apiData, { withCredentials: true });
        setContacts(contacts.map((c) => (c.id === currentContact.id ? response.data : c)));
        toast.success('Contact mis à jour avec succès');
      } else {
        await ensureCsrfForContacts();
        const response = await axios.post(`${API_BASE_URL}/contacts`, apiData, { withCredentials: true });
        setContacts([...contacts, response.data]);
        toast.success('Contact ajouté avec succès');
      }
      setIsModalOpen(false);
      fetchContacts();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la sauvegarde du contact';
      toast.error(errorMessage);
      console.error('Error saving contact:', err.response?.data || err.message);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce contact ?')) {
      try {
        await ensureCsrfForContacts();
        await axios.delete(`${API_BASE_URL}/contacts/${contact.id}`, { withCredentials: true });
        setContacts(contacts.filter((c) => c.id !== contact.id));
        toast.success('Contact supprimé avec succès');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression du contact';
        toast.error(errorMessage);
        console.error('Error deleting contact:', err.response?.data || err.message);
      }
    }
  };

  const handleSyncSources = async () => {
    try {
      await ensureCsrfForContacts();
      const response = await axios.post(`${API_BASE_URL}/sync-to-supabase`, undefined, { withCredentials: true });
      toast.success(`Synchronisation terminée : ${response.data.synced} contacts synchronisés`);
      fetchContacts();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la synchronisation avec Supabase';
      toast.error(errorMessage);
      console.error('Error syncing with Supabase:', err.response?.data || err.message);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await ensureCsrfForContacts();
      const response = await axios.post(`${API_BASE_URL}/contacts/import`, formData, {
        withCredentials: true,
        // Do not set Content-Type so the browser sets the right multipart boundary
      });
      toast.success(response.data.message);
      fetchContacts();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'importation du CSV';
      toast.error(errorMessage);
      console.error('Error importing CSV:', err.response?.data || err.message);
    }
  };

  const handleExport = async () => {
    try {
      await ensureCsrfForContacts();
      const response = await axios.get(`${API_BASE_URL}/contacts/export`, {
        responseType: 'blob',
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Contacts exportés avec succès');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'exportation des contacts';
      toast.error(errorMessage);
      console.error('Error exporting contacts:', err.response?.data || err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const categoryFormData = new FormData(form);
    const categoryName = categoryFormData.get('categoryName') as string;

    try {
      await ensureCsrfForContacts();
      const response = await axios.post(`${API_BASE_URL}/categories`, { nom: categoryName }, { withCredentials: true });
      setCategories([...categories, response.data]);
      setIsCategoryModalOpen(false);
      toast.success('Catégorie ajoutée avec succès');
      form.reset();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'ajout de la catégorie';
      toast.error(errorMessage);
      console.error('Error adding category:', err.response?.data || err.message);
    }
  };

  return (
    <Layout title="Gestion des contacts">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleAddContact} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un contact
          </Button>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Importer CSV
            </Button>
          </label>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button
            variant="outline"
            onClick={handleSyncSources}
            className="gap-2 ml-auto"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Synchroniser
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive text-destructive-foreground rounded-lg">
            {error}
          </div>
        )}

        {loading && <div>Chargement...</div>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((categorie) => (
                  <div
                    key={categorie.id} // Utilise id unique au lieu de nom
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: categorie.couleur }}
                      />
                      <span className="font-medium">{categorie.nom}</span>
                    </div>
                    <Badge variant="secondary">{categorie.contacts_count || 0}</Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => setIsCategoryModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            <DataTable
              title="Liste des contacts"
              columns={columns}
              data={contacts}
              onAdd={handleAddContact}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              filters={filters}
              searchPlaceholder="Rechercher par prénom, nom, email..."
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques par Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sourceStats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-4 border border-border rounded-lg"
                >
                  <h3 className="font-semibold text-lg">{stat.source}</h3>
                  <p className="text-2xl font-bold text-primary mt-2">{stat.contacts}</p>
                  <p className="text-sm text-muted-foreground">contacts</p>
                  <Badge className="mt-2 bg-success text-success-foreground">
                    {stat.statut}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentContact ? 'Modifier le contact' : 'Ajouter un contact'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) => setFormData({ ...formData, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google Maps">Google Maps</SelectItem>
                    <SelectItem value="Phantombuster">Phantombuster</SelectItem>
                    <SelectItem value="Site web">Site web</SelectItem>
                    <SelectItem value="Manuel">Manuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="categorie">Catégorie</Label>
                <Select
                  value={formData.categorie_id}
                  onValueChange={(value) => setFormData({ ...formData, categorie_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune catégorie</SelectItem> {/* Utilise 'none' au lieu de '' */}
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.statut}
                  onValueChange={(value) => setFormData({ ...formData, statut: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nouveau">Nouveau</SelectItem>
                    <SelectItem value="Contacté">Contacté</SelectItem>
                    <SelectItem value="Intéressé">Intéressé</SelectItem>
                    <SelectItem value="Non intéressé">Non intéressé</SelectItem>
                    <SelectItem value="Intéressé plus tard">Intéressé plus tard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">{currentContact ? 'Modifier' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <div id="dialog-description" className="sr-only">
            Ajouter une catégorie
          </div>
          <DialogHeader>
            <DialogTitle>Ajouter une catégorie</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCategory}>
            <div>
              <Label htmlFor="categoryName">Nom de la catégorie</Label>
              <Input id="categoryName" name="categoryName" required />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Contacts;