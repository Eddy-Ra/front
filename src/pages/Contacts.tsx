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

const Contacts = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [contactManual, setContactManual] = useState<any[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  // 🔑 NOUVEAUX ÉTATS pour la popup de suppression
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // État de chargement pour la suppression

  // 🔑 NOUVEAU: États pour la gestion des CONTACTS
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  // --- Charger les catégories dynamiques (avec anti-cache) ---
  const fetchCategories = async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/categories?_t=${timestamp}`);
      
      setCategories(
        res.data.map((cat: any, index: number) => ({
          ...cat,
          id: cat.id || `temp-${index}`,
        }))
      );
    } catch (err) {
    }
  };
  
  // --- Charger les contacts phantombuster
  const fetchContacts = async () => {
    try {
      const res = await api.get("/prospects");
      setContacts(res.data);
    } catch (err) {
    }
  };
// --- Charger les contacts manuel
  const fetchContactsManual = async () => {
    try {
      const res = await api.get("/b2b_manual");
      setContactManual(res.data);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchCategories();
    fetchContactsManual();
  }, []);

  const combineData = [...contacts, ...contactManual];
  console.log(combineData);
  

  const columns = [
    { key: "full_name", label: "Nom", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "company", label: "Société" },
  ];
  
  const filters = [
    { key: "source", label: "Source", options: ["Google Maps", "Phantombuster", "Manuel"] },
    { key: "categorie", label: "Catégorie", options: categories.map((c) => c.name) },
  ];

  // --- CRÉATION & MISE À JOUR (handleSaveCategory) ---
  const handleSaveCategory = async (name: string, color: string) => {
    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, { name, color });
      } else {
        await api.post("/categories", { name, color });
      }

      await fetchCategories();
      setEditingCategory(null);
      setIsPopupOpen(false);
    } catch (error) {
    }
  };

  // --- ÉDITION (handleEditCategory) ---
  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsPopupOpen(true);
  };

  // 🔑 NOUVEAU : Fonction pour ouvrir la popup de suppression
  const handleOpenDeletePopup = (category: any) => {
    setCategoryToDelete({ id: category.id, name: category.name });
    setIsDeletePopupOpen(true);
  };
  
  // 🔑 NOUVEAU : Fonction pour exécuter la suppression après confirmation
  const handleConfirmDelete = async () => {
    if (!categoryToDelete?.id) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      await fetchCategories();
      
      setIsDeletePopupOpen(false);
      setCategoryToDelete(null);

    } catch (error) {
    } finally {
      setIsDeleting(false);
    }
  };

    // ------------------------------------
    // --- Logique Contacts (Ajout & Edition) ---
    // ------------------------------------
    
    // 🔑 1. Ouvre la popup d'ajout de contact
    const handleAddContact = () => {
      setEditingContact(null); // S'assurer que c'est un ajout
      setIsContactPopupOpen(true);
    };
  
    // 🔑 2. Sauvegarde le contact
    const handleSaveContact = async (data: any) => {
      try {
        if (editingContact) {
            await api.patch(`/prospects/${editingContact.id}`, data);
        } else {
            await api.post("/prospects", data);
        }
        await fetchContacts(); // Rafraîchir la liste
        setIsContactPopupOpen(false);
      } catch (error) {
      }
    };
  
    // 🔑 3. Édition (Ouvre la popup avec les données du contact)
    const handleEditContact = (contact: any) => {
      setEditingContact(contact);
      setIsContactPopupOpen(true); 
    };
  
    // 🔑 4. Suppression (Implémentation factice)
    const handleDeleteContact = (contact: any) => {
      // Logique pour ouvrir une popup de confirmation de suppression de contact
    };

  return (
    <Layout title="Gestion des contacts">
      {/* Styles globaux pour cacher la barre de scroll sur Webkit (Chrome/Safari/Edge) */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      
      <div className="space-y-6">
        {/* Actions principales (omis pour la concision) */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
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
            onClick={fetchCategories}
            className="gap-2 ml-auto border-[#8675E1] border-2 text-[#8675E1]"
          >
            <RefreshCw className="h-4 w-4" /> Synchroniser
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Catégories - Design Modifié */}
          <Card className="flex flex-col h-full max-h-[800px]"> {/* 1. Rendre la Card flexible et donner une hauteur max */}
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>
            
            <CardContent className="flex flex-col h-full p-0"> {/* 2. Rendre CardContent flexible, padding géré par les enfants */}
              
              {/* 3. Zone de Liste Scrollable avec overflow-y-auto et barre cachée */}
              <div 
                className="flex-grow space-y-3 overflow-y-auto hide-scrollbar px-6 pt-0 pb-3" // flex-grow prend l'espace, px-6 pour le padding horizontal
              >
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
                          // 🔑 APPEL À LA NOUVELLE FONCTION POPUP
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
              
              {/* 4. Bouton Fixé en Bas */}
              <div className="p-6 pt-4 border-t border-border bg-card"> {/* p-6 pour le padding de CardContent, pt-4 pour la séparation visuelle */}
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
              data={combineData}
              filters={filters}
              searchPlaceholder="Rechercher par nom, email..."
            />
          </div>
        </div>

        {/* Popup de catégorie (édition + création) */}
        <CategoryPopup
          isOpen={isPopupOpen}
          onClose={() => {
            setIsPopupOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
          initialData={editingCategory}
        />
        
        {/* 🔑 NOUVELLE POPUP DE CONFIRMATION DE SUPPRESSION */}
        <DeleteConfirmationPopup
          isOpen={isDeletePopupOpen}
          onClose={() => setIsDeletePopupOpen(false)}
          onConfirm={handleConfirmDelete}
          categoryName={categoryToDelete?.name || ''}
          loading={isDeleting}
        />
      </div>
    </Layout>
  );
};

export default Contacts;