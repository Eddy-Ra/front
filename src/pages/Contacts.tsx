import React, { useState, useEffect, useMemo } from "react";
import { Plus, Download, Upload, RefreshCw, Edit, Trash2, Loader2 } from "lucide-react";
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

// ─── Normalisation des champs ────────────────────────────────────────────────
// Certains contacts (Google Map, Societe) stockent le nom dans "Nom"/"Mail"
// au lieu de "full_name"/"email". On unifie ici, SANS toucher à category_id.
const normalizeContact = (contact: any) => ({
  ...contact,
  full_name: contact.full_name || contact.Nom     || contact.nom     || "",
  email:     contact.email     || contact.Mail    || contact.mail    || "",
  company:   contact.company   || contact.Société || contact.societe || "",
  // category_id est conservé tel quel via ...contact
});

const Contacts = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [contactManual, setContactManual] = useState<any[]>([]);

  // 🔑 Filtre par clic direct sur une catégorie (UUID)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  // Filtre dropdown DataTable (par nom)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);

  // Catégorie
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: any; name: string; contactCount: number;
  } | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contacts
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  // Suppression de contact
  const [isDeleteContactPopupOpen, setIsDeleteContactPopupOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);

  // ─── Count contacts par catégorie ────────────────────────────────────────────
  // ✅ On garde === qui fonctionnait avant — ne pas changer
  const getContactCount = (categoryId: any, contactsList: any[]) => {
    return contactsList.filter(contact => contact.category_id === categoryId).length;
  };

  // ─── Chargement des données ──────────────────────────────────────────────────

  const fetchAllContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/b2b_datasynch");
      // ✅ normalizeContact unifie les champs nom/email sans toucher category_id
      const normalized = res.data.map(normalizeContact);
      setContactManual(normalized);
      setContacts(normalized);
      return normalized;
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
      return [];
    }
  };

  const fetchCategories = async (manualContacts: any[] = contactManual) => {
    setIsCategoriesLoading(true);
    try {
      const res = await api.get("/categories");
      const categoriesWithCount = res.data.map((cat: any, index: number) => ({
        ...cat,
        id: cat.id || `temp-${index}`,
        // ✅ === fonctionne car category_id et cat.id sont tous deux des UUID strings
        contact_count: getContactCount(cat.id, manualContacts),
      }));
      setCategories(categoriesWithCount);
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const allContacts = await fetchAllContacts();
      await fetchCategories(allContacts);
      setLoading(false);
    };
    loadData();
  }, []);

  // ─── Colonnes (unifiées, plus de doublons) ───────────────────────────────────
  const columns = [
    { key: "full_name", label: "Nom",     sortable: true },
    { key: "email",     label: "Email",   sortable: true },
    { key: "company",   label: "Société" },
  ];

  // ─── Filtrage des contacts ───────────────────────────────────────────────────
  const filteredContactManual = useMemo(() => {
    // 1. Clic sur catégorie (UUID direct) — ✅ === conservé
    if (selectedCategoryId) {
      return contactManual.filter(c => c.category_id === selectedCategoryId);
    }
    // 2. Dropdown catégorie (par nom → UUID) — ✅ === conservé
    if (selectedCategoryFilter) {
      const category = categories.find(cat => cat.name === selectedCategoryFilter);
      if (!category) return [];
      return contactManual.filter(c => c.category_id === category.id);
    }
    // 3. Tous les contacts
    return contactManual;
  }, [contactManual, selectedCategoryId, selectedCategoryFilter, categories]);

  // ─── Filtres DataTable ───────────────────────────────────────────────────────
  const filters = useMemo(() => [
    {
      key: "source",
      label: "Source",
      options: ["Google Map", "Phantombuster", "Manuel", "societe"],
    },
    {
      key: "categorie",
      label: "Catégorie",
      options: ["Toutes", ...categories.map(c => c.name)],
    },
  ], [categories]);

  const handleFilterChange = (filterKey: string, value: string | null) => {
    if (filterKey === "categorie") {
      setSelectedCategoryId(null);
      setSelectedCategoryFilter(value === null || value === "Toutes" ? null : value);
    }
  };

  // ─── Clic catégorie (toggle) ─────────────────────────────────────────────────
  const handleCategoryClick = (categoryId: any) => {
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    } else {
      setSelectedCategoryId(categoryId);
      setSelectedCategoryFilter(null);
    }
  };

  // ─── CRUD Catégories ─────────────────────────────────────────────────────────

  const handleSaveCategory = async (name: string, color: string) => {
    try {
      if (editingCategory) {
        const res = await api.patch(`/categories/${editingCategory.id}`, { name, color });
        setCategories(prev =>
          prev.map(cat =>
            cat.id === editingCategory.id
              ? { ...res.data, contact_count: cat.contact_count }
              : cat
          )
        );
      } else {
        const res = await api.post("/categories", { name, color });
        setCategories(prev => [{ ...res.data, contact_count: 0 }, ...prev]);
      }
      setEditingCategory(null);
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Erreur sauvegarde catégorie:", error);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsPopupOpen(true);
  };

  const handleOpenDeletePopup = (category: any) => {
    setCategoryToDelete({
      id: category.id,
      name: category.name,
      contactCount: category.contact_count,
    });
    setIsDeletePopupOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete?.id) return;
    if (categoryToDelete.contactCount > 0) {
      setIsDeletePopupOpen(false);
      setCategoryToDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      if (selectedCategoryId === categoryToDelete.id) setSelectedCategoryId(null);
      await fetchCategories();
      setIsDeletePopupOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Erreur suppression catégorie:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── CRUD Contacts ───────────────────────────────────────────────────────────

  const handleAddContact = () => {
    setEditingContact(null);
    setIsContactPopupOpen(true);
  };

  const handleSaveContact = async (formData: any) => {
    try {
      setLoading(true);

      const apiData = {
        full_name:   formData.full_name,
        email:       formData.email,
        company:     formData.company,
        category_id: formData.category_id,
        source:      formData.source,
      };

      const oldCategoryId = editingContact ? editingContact.category_id : null;
      const newCategoryId = formData.category_id;
      let finalContact: any;

      if (editingContact) {
        await api.patch(`/b2b_datasynch/${editingContact.id}`, apiData);
        // ✅ normalizeContact appliqué aussi sur l'édition
        finalContact = normalizeContact({ ...editingContact, ...apiData });
        setContactManual(prev =>
          prev.map(c => c.id === editingContact.id ? finalContact : c)
        );
      } else {
        const res = await api.post("/b2b_datasynch", apiData);
        finalContact = normalizeContact({
          id: res.data.id,
          ...apiData,
          created_at: res.data.created_at || new Date().toISOString(),
          updated_at: res.data.updated_at || new Date().toISOString(),
        });
        setContactManual(prev => [finalContact, ...prev]);
      }

      // Mise à jour compteurs catégorie — ✅ === conservé
      setCategories(prev =>
        prev.map(cat => {
          if (oldCategoryId && cat.id === oldCategoryId && oldCategoryId !== newCategoryId) {
            return { ...cat, contact_count: Math.max(0, cat.contact_count - 1) };
          }
          if (cat.id === newCategoryId && (!editingContact || oldCategoryId !== newCategoryId)) {
            return { ...cat, contact_count: cat.contact_count + 1 };
          }
          return cat;
        })
      );

      setIsContactPopupOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error("Erreur sauvegarde contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = (contact: any) => {
    if (!contact?.id) return;
    setEditingContact(contact);
    setIsContactPopupOpen(true);
  };

  const handleOpenDeleteContactPopup = (contact: any) => {
    if (!contact?.id) return;
    setContactToDelete(contact);
    setIsDeleteContactPopupOpen(true);
  };

  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete?.id) {
      setIsDeleteContactPopupOpen(false);
      setContactToDelete(null);
      return;
    }
    setIsDeletingContact(true);
    try {
      await api.delete(`/b2b_datasynch/${contactToDelete.id}`);
      setContactManual(prev => prev.filter(c => c.id !== contactToDelete.id));

      const deletedCategoryId = contactToDelete.category_id;
      if (deletedCategoryId) {
        // ✅ === conservé
        setCategories(prev =>
          prev.map(cat =>
            cat.id === deletedCategoryId
              ? { ...cat, contact_count: Math.max(0, cat.contact_count - 1) }
              : cat
          )
        );
      }

      setIsDeleteContactPopupOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error("Erreur suppression contact:", error);
    } finally {
      setIsDeletingContact(false);
    }
  };

  // ─── Rendu liste catégories ──────────────────────────────────────────────────

  const renderCategoryContent = () => {
    if (isCategoriesLoading) {
      return (
        <div className="flex-grow h-40 flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="flex-grow h-40 flex items-center justify-center p-6">
          <p className="text-center text-sm text-muted-foreground">Aucune catégorie trouvée.</p>
        </div>
      );
    }

    return (
      <div className="flex-grow h-40 space-y-3 overflow-y-auto hide-scrollbar px-6 pt-0 pb-3">
        {categories.map((cat: any) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`
                flex items-center justify-between p-3 border rounded-lg group
                transition-colors cursor-pointer select-none relative
                ${isSelected
                  ? "border-[#8675E1] bg-[#8675E1]/10"
                  : "border-border hover:bg-secondary/50"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full flex-shrink-0 ${cat.color}`} />
                <span className={`font-medium truncate max-w-[120px] ${isSelected ? "text-[#8675E1]" : ""}`}>
                  {cat.name}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className={`transition-opacity duration-200 group-hover:opacity-0 ${
                    isSelected ? "bg-[#8675E1]" : ""
                  }`}
                >
                  {cat.contact_count || 0}
                </Badge>

                {/* Boutons Edit / Delete au hover */}
                <div className="absolute right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={e => { e.stopPropagation(); handleEditCategory(cat); }}
                    title="Modifier la catégorie"
                  >
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={e => { e.stopPropagation(); handleOpenDeletePopup(cat); }}
                    title="Supprimer la catégorie"
                  >
                    <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Rendu principal ─────────────────────────────────────────────────────────

  return (
    <Layout title="Gestion des contacts">
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
              const triggerN8nFlow = async () => {
                try {
                  setLoading(true);
                  setIsCategoriesLoading(true);
                  await api.post(
                    "https://n8n.projets-omega.net/webhook/c9118e3f-fc01-478e-9031-a5a7dee8c53e",
                    {
                      action: "sync_trigger",
                      source: "manual_button",
                      timestamp: new Date().toISOString(),
                    }
                  );
                  const allContacts = await fetchAllContacts();
                  await fetchCategories(allContacts);
                } catch (error) {
                  console.error("Erreur synchronisation:", error);
                } finally {
                  setLoading(false);
                  setIsCategoriesLoading(false);
                }
              };
              triggerN8nFlow();
            }}
            className="gap-2 ml-auto border-[#8675E1] border-2 text-[#8675E1]"
            disabled={isCategoriesLoading || loading}
          >
            {isCategoriesLoading || loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />
            } Synchroniser
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ── Card Catégories ── */}
          <Card className="flex flex-col h-full max-h-[800px] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Catégories</CardTitle>
                {selectedCategoryId && (
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="text-xs text-[#8675E1] hover:underline"
                  >
                    Tout afficher
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full p-0 relative">
              {renderCategoryContent()}
              <div className="p-6 pt-4 border-t border-border bg-card">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-[#8675E1] border-2 text-[#8675E1]"
                  onClick={() => { setEditingCategory(null); setIsPopupOpen(true); }}
                  disabled={isCategoriesLoading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Nouvelle catégorie
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Table des contacts ── */}
          <div className="lg:col-span-3">

            {/* Bandeau filtre actif */}
            {selectedCategoryId && (() => {
              const activeCat = categories.find(c => c.id === selectedCategoryId);
              return activeCat ? (
                <div className="mb-3 flex items-center gap-2 text-sm text-[#8675E1] px-1">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${activeCat.color}`} />
                  <span>
                    Filtre actif : <strong>{activeCat.name}</strong> — {filteredContactManual.length} contact(s)
                  </span>
                  <button
                    onClick={() => setSelectedCategoryId(null)}
                    className="ml-auto text-xs hover:underline text-muted-foreground"
                  >
                    ✕ Effacer
                  </button>
                </div>
              ) : null;
            })()}

            <DataTable
              title="Liste des contacts"
              columns={columns}
              data={filteredContactManual}
              filters={filters}
              searchPlaceholder="Rechercher par nom, email..."
              onEdit={handleEditContact}
              onDelete={handleOpenDeleteContactPopup}
              onAdd={handleAddContact}
              onFilterChange={handleFilterChange}
              isLoading={loading || isCategoriesLoading}
            />
          </div>
        </div>

        {/* ── Statistiques par source ── */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques par Source</CardTitle>
          </CardHeader>
          <CardContent>
            {(loading || isCategoriesLoading) ? (
              <div className="flex items-center justify-center min-h-[100px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (() => {
              const phantombusterCount = contactManual.filter(
                c => c.source?.toLowerCase() === "phantombuster"
              ).length;
              const manuelCount = contactManual.filter(c =>
                ["ajout manuel", "manuel"].includes(c.source?.toLowerCase() ?? "")
              ).length;
              const societeCount = contactManual.filter(
                c => c.source?.toLowerCase() === "societe"
              ).length;
              const googleCount = contactManual.filter(
                c => c.source?.toLowerCase() === "google map"
              ).length;
              const total = phantombusterCount + manuelCount + societeCount + googleCount;

              const stats = [
                { label: "Phantombuster", value: phantombusterCount },
                { label: "Ajout Manuel",  value: manuelCount },
                { label: "Société",       value: societeCount },
                { label: "Google Map",    value: googleCount },
                { label: "Total",         value: total },
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {stats.map(s => (
                    <div key={s.label} className="text-center p-4 border border-border rounded-lg">
                      <h3 className="font-semibold text-lg">{s.label}</h3>
                      <p className="text-2xl font-bold text-primary mt-2">{s.value}</p>
                      <p className="text-sm text-muted-foreground">contacts</p>
                      <Badge className="mt-2 bg-success text-success-foreground">Actif</Badge>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* ── Popups ── */}
        <CategoryPopup
          isOpen={isPopupOpen}
          onClose={() => { setIsPopupOpen(false); setEditingCategory(null); }}
          onSave={handleSaveCategory}
          initialData={editingCategory}
        />

        <ContactPopup
          isOpen={isContactPopupOpen}
          onClose={() => { setIsContactPopupOpen(false); setEditingContact(null); }}
          onSave={handleSaveContact}
          initialData={editingContact}
          categories={categories}
          loading={loading}
        />

        <DeleteConfirmationPopup
          isOpen={isDeletePopupOpen}
          onClose={() => setIsDeletePopupOpen(false)}
          onConfirm={handleConfirmDelete}
          categoryName={categoryToDelete?.name || ""}
          contactCount={categoryToDelete?.contactCount || 0}
          loading={isDeleting}
        />

        <ContactDeleteConfirmationPopup
          isOpen={isDeleteContactPopupOpen}
          onClose={() => setIsDeleteContactPopupOpen(false)}
          onConfirm={handleConfirmDeleteContact}
          contactName={contactToDelete?.full_name || ""}
          loading={isDeletingContact}
        />
      </div>
    </Layout>
  );
};

export default Contacts;
