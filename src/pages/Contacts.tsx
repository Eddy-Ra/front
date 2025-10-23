import React, { useState, useEffect } from "react";
import { Plus, Download, Upload, RefreshCw, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/ui/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/api";
import { CategoryPopup } from "../components/CategoryPopup";
import { DeleteConfirmationPopup } from "../components/DeleteConfirmationPopup";
import { ContactDeleteConfirmationPopup } from "@/components/ContactDeleteConfirmationPopup";

const Contacts = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [contactManual, setContactManual] = useState<any[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

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
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/categories?_t=${timestamp}`);
      setCategories(res.data.map((cat: any, index: number) => ({
        ...cat,
        id: cat.id || `temp-${index}`, 
      })));
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
    }
  };
  const fetchContacts = async () => {
    try {
      const res = await api.get("/prospects");
      setContacts(res.data);
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
    }
  };

  const fetchContactsManual = async () => {
    try {
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
    { key: "categorie", label: "Catégorie", options: categories.map((c) => c.name) },
  ];

  // --- GESTION DES CATÉGORIES ---

  // 🔄 CRÉATION & MISE À JOUR DES CATÉGORIES (CORRIGÉ)
// --- CRÉATION & MISE À JOUR (handleSaveCategory) ---
// --- CRÉATION & MISE À JOUR (handleSaveCategory) ---
const handleSaveCategory = async (name: string, color: string) => {
  try {
    if (editingCategory) {
      // 🔄 Mise à jour : on PATCH puis on remplace l'ancien objet par le nouveau (res.data)
      const res = await api.patch(`/categories/${editingCategory.id}`, { name, color });
      setCategories((prev) =>
        prev.map((cat) => (cat.id === editingCategory.id ? res.data : cat))
      );
    } else {
      // ➕ Ajout : on POST puis on ajoute l'objet retourné (res.data, qui a l'ID définitif)
      const res = await api.post("/categories", { name, color });
      setCategories((prev) => [...prev, res.data]);
    }

    setEditingCategory(null);
    setIsPopupOpen(false);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de la catégorie:", error);
    // Optionnel : En cas d'échec de mise à jour directe, forcer un fetch en dernier recours
    // fetchCategories(); 
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

  // 🔄 SUPPRESSION DES CATÉGORIES (CORRIGÉ POUR ÊTRE COHÉRENT)
  const handleConfirmDelete = async () => {
    if (!categoryToDelete?.id) return;

    setIsDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      // Utiliser la même logique que pour l'ajout : recharger les données
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

  // 💾 SAUVEGARDE D'UN CONTACT (DÉCOMMENTÉ ET CORRIGÉ)
  const handleSaveContact = async (formData: any) => {
    try {
      if (editingContact) {
        // Mise à jour d'un contact existant
        const res = await api.patch(`/b2b_manual/${editingContact.id}`, formData);
        setContactManual((prev) =>
          prev.map((contact) => (contact.id === editingContact.id ? res.data : contact))
        );
      } else {
        // Ajout d'un nouveau contact
        const res = await api.post('/b2b_manual', formData);
        // Recharger les contacts pour s'assurer d'avoir les données fraîches
        await fetchContactsManual();
      }
      
      setIsContactPopupOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Erreur sauvegarde contact:', error);
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
      // Mise à jour instantanée de l'état local
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
            className="gap-2 ml-auto border-[#8675E1] border-2 text-[#8675E1]"
          >
            <RefreshCw className="h-4 w-4" /> Synchroniser
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Catégories */}
          <Card className="flex flex-col h-full max-h-[800px] overflow-hidden">
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full p-0">
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
              </div>
              <div className="p-6 pt-4 border-t border-border bg-card">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#8675E1] border-2 text-[#8675E1]"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsPopupOpen(true);
                  }}
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

        {/* Popups */}
        <CategoryPopup
          isOpen={isPopupOpen}
          onClose={() => {
            setIsPopupOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          initialData={editingCategory}
        />

        {/* 🔑 AJOUTER ContactPopup ICI */}
        {/* <ContactPopup
          isOpen={isContactPopupOpen}
          onClose={() => {
            setIsContactPopupOpen(false);
            setEditingContact(null);
          }}
          onSave={handleSaveContact}
          initialData={editingContact}
        /> */}

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