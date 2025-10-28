import React, { useState, useEffect } from "react";
import { Plus, Download, Upload, RefreshCw, Edit, Trash2, Loader2 } from "lucide-react"; // 🔑 Import de Loader2
import { Layout } from "@/components/ui/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/api";
import { CategoryPopup } from "../components/CategoryPopup";
import { DeleteConfirmationPopup } from "../components/DeleteConfirmationPopup";
import { ContactDeleteConfirmationPopup } from "@/components/ContactDeleteConfirmationPopup";
import { ContactPopup } from "../components/ContactPopup"; 

const Contacts = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [contactManual, setContactManual] = useState<any[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  const [loading, setLoading] = useState(false);
  // 🔑 NOUVEL ÉTAT : Pour le chargement des catégories
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false); 

  // États pour la popup de suppression de catégorie
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour la gestion des contacts
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  // États pour la popup de suppression de contact
  const [isDeleteContactPopupOpen, setIsDeleteContactPopupOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  // --- Charger les données ---
  const fetchCategories = async () => {
    // 🔑 Démarrer le chargement
    setIsCategoriesLoading(true); 
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/categories?_t=${timestamp}`);
      setCategories(res.data.map((cat: any, index: number) => ({
        ...cat,
        id: cat.id || `temp-${index}`,
      })));
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
    } finally {
      // 🔑 Arrêter le chargement
      setIsCategoriesLoading(false); 
    }
  };

  const fetchContacts = async () => {
    try {
      // On ne met pas de spinner pour les contacts car cela ralentirait la page
      const res = await api.get("/b2b_manual");
      setContacts(res.data);
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
    }
  };

  const fetchContactsManual = async () => {
    try {
      // On ne met pas de spinner pour les contacts car cela ralentirait la page
      const res = await api.get("/b2b_manual");
      setContactManual(res.data);
    } catch (err) {
      console.error("Erreur chargement contacts manuels:", err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchCategories();
    fetchContactsManual();
  }, []);

  const combineData = [...contacts, ...contactManual];

  const columns = [
    { key: "full_name", label: "Nom", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "company", label: "Société" },
  ];

  const filters = [
    { key: "source", label: "Source", options: ["Google Maps", "Phantombuster", "Manuel"] },
    // S'assurer que les options de filtre sont basées sur le state mis à jour
    { key: "categorie", label: "Catégorie", options: categories.map((c) => c.name) }, 
  ];

  // --- GESTION DES CATÉGORIES ---
  const handleSaveCategory = async (name: string, color: string) => {
    try {
      if (editingCategory) {
        const res = await api.patch(`/categories/${editingCategory.id}`, { name, color });
        setCategories((prev) =>
          prev.map((cat) => (cat.id === editingCategory.id ? res.data : cat))
        );
      } else {
        const res = await api.post("/categories", { name, color });
        setCategories((prev) => [...prev, res.data]);
      }

      setEditingCategory(null);
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la catégorie:", error);
    }
  };
  
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsPopupOpen(true);
  };
  
  const handleOpenDeletePopup = (category: any) => {
    setCategoryToDelete({ id: category.id, name: category.name });
    setIsDeletePopupOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!categoryToDelete?.id) return;

    setIsDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      await fetchCategories();
      
      setIsDeletePopupOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Erreur suppression catégorie:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // --- GESTION DES CONTACTS ---

  // ➕ AJOUT D'UN CONTACT
  const handleAddContact = () => {
    setEditingContact(null);
    setIsContactPopupOpen(true);
  };

// 💾 SAUVEGARDE D'UN CONTACT (VERSION ROBUSTE)
const handleSaveContact = async (formData: any) => {
  try {
    setLoading(true);

    // Préparer les données pour l'API
    const apiData = {
      full_name: formData.full_name,
      email: formData.email,
      company: formData.company,
      category_id: formData.category_id,
      source: formData.source
    };
    
    let contactId;
    let finalContact;

    if (editingContact) {
      // Mise à jour
      const res = await api.patch(`/b2b_manual/${editingContact.id}`, apiData);
      contactId = editingContact.id;
      
      // Mise à jour instantanée avec les données du formulaire
      finalContact = {
          ...editingContact, // Conserver les relations/champs non mis à jour
          ...apiData,       // Appliquer les nouvelles données
          id: contactId
      };
      
      setContactManual(prev =>
        prev.map(c => c.id === contactId ? finalContact : c)
      );

    } else {
      // Ajout
      const res = await api.post('/b2b_manual', apiData);
      
      // 🔥 CORRECTION : Construire l'objet complet pour l'affichage
      contactId = res.data.id;
      finalContact = {
        id: contactId,
        full_name: formData.full_name,
        email: formData.email,
        company: formData.company,
        category_id: formData.category_id,
        source: formData.source,
        created_at: res.data.created_at || new Date().toISOString(),
        updated_at: res.data.updated_at || new Date().toISOString()
      };
      
      setContactManual(prev => [finalContact, ...prev]);
    }

    // Fermer la popup
    setIsContactPopupOpen(false);
    setEditingContact(null);

  } catch (error) {
    console.error('Erreur save contact:', error);
  } finally {
    setLoading(false);
  }
};

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setIsContactPopupOpen(true);
  };

  const handleOpenDeleteContactPopup = (contact: any) => {
    setContactToDelete(contact);
    setIsDeleteContactPopupOpen(true);
  };
  
  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete) return;

    setIsDeletingContact(true);
    try {
      await api.delete(`/b2b_manual/${contactToDelete.id}`);
      setContactManual(prev => prev.filter(c => c.id !== contactToDelete.id));
      setIsDeleteContactPopupOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Erreur suppression contact:', error);
    } finally {
      setIsDeletingContact(false);
    }
  };

  return (
    <Layout title="Gestion des contacts">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="space-y-6">
        {/* Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="outline" 
            className="gap-2 border-[#8675E1] border-2 text-[#8675E1]"
            onClick={handleAddContact}
          >
            <Plus className="h-4 w-4" /> Ajouter un contact
          </Button>
          <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
            <Upload className="h-4 w-4" /> Importer CSV
          </Button>
          <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
            <Download className="h-4 w-4" /> Exporter
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              fetchCategories();
              fetchContacts();
              fetchContactsManual();
            }}
            // 🔑 Afficher le spinner sur le bouton de synchronisation
            className="gap-2 ml-auto border-[#8675E1] border-2 text-[#8675E1]"
            disabled={isCategoriesLoading}
          >
            {isCategoriesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Synchroniser
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Catégories */}
          <Card className="flex flex-col h-full max-h-[800px] overflow-hidden">
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full p-0">
              {/* 🔑 Afficher le spinner ou la liste */}
              {isCategoriesLoading ? (
                <div className="flex-grow h-40 flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="flex-grow h-40 space-y-3 overflow-y-auto hide-scrollbar px-6 pt-0 pb-3">
                  {categories.map((cat: any) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg group hover:bg-secondary/50 transition-colors relative"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${cat.color}`} />
                        <span className="font-medium truncate max-w-[120px]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="secondary"
                          className="transition-opacity duration-200 group-hover:opacity-0"
                        >
                          {cat.contact_count || 0}
                        </Badge>
                        <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditCategory(cat)}
                            title="Modifier la catégorie"
                          >
                            <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenDeletePopup(cat)}
                            title="Supprimer la catégorie"
                          >
                            <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground pt-3">Aucune catégorie trouvée.</p>
                  )}
                </div>
              )}
              <div className="p-6 pt-4 border-t border-border bg-card">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#8675E1] border-2 text-[#8675E1]"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsPopupOpen(true);
                  }}
                  disabled={isCategoriesLoading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Nouvelle catégorie
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table des contacts */}
          <div className="lg:col-span-3">
            <DataTable
              title="Liste des contacts"
              columns={columns}
              data={contactManual}
              filters={filters}
              searchPlaceholder="Rechercher par nom, email..."
              onEdit={handleEditContact}
              onDelete={handleOpenDeleteContactPopup}
              onAdd={handleAddContact}
            />
          </div>
        </div>

                          {/* SECTION: Statistiques des sources */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques par Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-lg">Google Maps</h3>
                <p className="text-2xl font-bold text-primary mt-2">1,523</p>
                <p className="text-sm text-muted-foreground">contacts</p>
                <Badge className="mt-2 bg-success text-success-foreground">Actif</Badge>
              </div>
              
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-lg">Phantombuster</h3>
                <p className="text-2xl font-bold text-primary mt-2">894</p>
                <p className="text-sm text-muted-foreground">contacts</p>
                <Badge className="mt-2 bg-success text-success-foreground">Actif</Badge>
              </div>
              
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-lg">Ajout Manuel</h3>
                <p className="text-2xl font-bold text-primary mt-2">430</p>
                <p className="text-sm text-muted-foreground">contacts</p>
                <Badge className="mt-2 bg-success text-success-foreground">Actif</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popups (inchangées) */}
        <CategoryPopup
          isOpen={isPopupOpen}
          onClose={() => {
            setIsPopupOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          initialData={editingCategory}
        />

        <ContactPopup
          isOpen={isContactPopupOpen}
          onClose={() => {
            setIsContactPopupOpen(false);
            setEditingContact(null);
          }}
          onSave={handleSaveContact}
          initialData={editingContact}
          categories={categories}
          loading={loading}
        />

        <DeleteConfirmationPopup
          isOpen={isDeletePopupOpen}
          onClose={() => setIsDeletePopupOpen(false)}
          onConfirm={handleConfirmDelete}
          categoryName={categoryToDelete?.name || ''}
          loading={isDeleting}
        />

        <ContactDeleteConfirmationPopup
          isOpen={isDeleteContactPopupOpen}
          onClose={() => setIsDeleteContactPopupOpen(false)}
          onConfirm={handleConfirmDeleteContact}
          contactName={contactToDelete?.full_name || ''}
          loading={isDeletingContact}
        />
      </div>
    </Layout>
  );
};

export default Contacts;