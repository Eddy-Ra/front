<<<<<<< HEAD
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Download, Upload, RefreshCw, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/ui/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/api";
import { CategoryPopup } from "../components/CategoryPopup";
// 🔑 Renommer l'import pour la popup de catégorie (l'originale)
import { DeleteConfirmationPopup as CategoryDeleteConfirmationPopup } from "../components/DeleteConfirmationPopup";
// 🔑 Importer la nouvelle popup dédiée aux contacts
import { ContactDeleteConfirmationPopup } from "../components/ContactDeleteConfirmationPopup";

const Contacts = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [contactManual, setContactManual] = useState<any[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // ÉTATS DE SUPPRESSION DE CATÉGORIE (EXISTANTS)
  const [isCategoryDeletePopupOpen, setIsCategoryDeletePopupOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false); 

  // ÉTATS DE GESTION DES CONTACTS (Ajout/Edition)
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);

  // 🔑 NOUVEAUX ÉTATS POUR LA SUPPRESSION DE CONTACT
  const [isContactDeletePopupOpen, setIsContactDeletePopupOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any | null>(null);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  
  // --- Fonctions de chargement ---
  const fetchCategories = useCallback(async () => {
    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/categories?_t=${timestamp}`);
      setCategories(
        res.data.map((cat: any, index: number) => ({
          ...cat,
          id: cat.id || `temp-${index}`,
        }))
      );
    } catch (err) { console.error('Erreur chargement catégories:', err); }
  }, []);
  
  const fetchContacts = useCallback(async () => {
    try {
      const res = await api.get("/prospects");
      setContacts(res.data);
    } catch (err) { console.error('Erreur chargement contacts prospects:', err); }
  }, []);
  
  const fetchContactsManual = useCallback(async () => {
    try {
      const res = await api.get("/b2b_manual");
      setContactManual(res.data);
    } catch (err) { console.error('Erreur chargement contacts manuels:', err); }
  }, []);

  const handleDataRefresh = useCallback(async () => {
    await Promise.all([fetchContacts(), fetchCategories(), fetchContactsManual()]);
  }, [fetchContacts, fetchCategories, fetchContactsManual]);

  useEffect(() => {
    handleDataRefresh();
  }, [handleDataRefresh]);

  const contactsWithNames = useMemo(() => {
    return contactManual.map(contact => {
        const category = categories.find(cat => String(cat.id) === String(contact.category_id));
        return {
            ...contact,
            category_name: category ? category.name : 'Non classé',
        };
    });
  }, [contactManual, categories]);

  const columns = [
    { key: "full_name", label: "Nom", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "company", label: "Société" },
  ];

  const filters = [
    { key: "source", label: "Source", options: ["Google Maps", "Phantombuster", "Manuel"] },
    { key: "categorie", label: "Catégorie", options: categories.map((c) => c.name) },
  ];

  // --- Logique Catégories ---
  const handleSaveCategory = async (name: string, color: string) => { /* ... */ };
  const handleEditCategory = (category: any) => { /* ... */ };

  // 🔑 Ouvre la popup de suppression de CATÉGORIE
  const handleOpenCategoryDeletePopup = (category: any) => {
    setCategoryToDelete({ id: category.id, name: category.name });
    setIsCategoryDeletePopupOpen(true);
  };

  // 🔑 Exécute la suppression de CATÉGORIE
  const handleConfirmCategoryDelete = async () => {
    if (!categoryToDelete?.id) return;

    setIsDeletingCategory(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      await handleDataRefresh();
      setIsCategoryDeletePopupOpen(false);
      setCategoryToDelete(null);
    } catch (error) { console.error('Erreur suppression catégorie:', error); } 
    finally { setIsDeletingCategory(false); }
  };

  // ------------------------------------
  // --- Logique Contacts ---
  // ------------------------------------

  const handleAddContact = () => { /* ... */ };
  const handleEditContact = (contact: any) => { /* ... */ };
  // const handleSaveContact = async (data: any) => { /* ... */ };

  
  // 🔑 1. Remplace l'ancien handleDeleteContact (avec confirm())
  const handleDeleteContact = (contact: any) => {
    setContactToDelete(contact);
    setIsContactDeletePopupOpen(true);
  };

  /**
   * 🔑 2. Exécute la suppression du contact après confirmation
   */
  const handleConfirmDeleteContact = async () => {
    if (!contactToDelete?.id) return;

    setIsDeletingContact(true);
    try {
      await api.delete(`/b2b_manual/${contactToDelete.id}`);

      // Mise à jour instantanée du state
      setContactManual(prev => prev.filter(c => c.id !== contactToDelete.id));
      
      setIsContactDeletePopupOpen(false);
      setContactToDelete(null);
    } catch (error) {
      console.error('Erreur suppression contact:', error);
    } finally {
      setIsDeletingContact(false);
    }
  };


  return (
    <Layout title="Gestion des contacts">
      {/* Styles globaux (omis pour la concision) */}
=======
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactPopup } from '../ContactPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/api/api';

// Largeurs fixes pour les colonnes
const COLUMN_WIDTHS: Record<string, string> = {
  full_name: 'w-[180px]',
  email: 'w-[250px]',
  company: 'w-[180px]',
  source: 'w-[120px]',
  categorie: 'w-[150px]',
};

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  filters?: { key: string; label: string; options: string[] }[];
  searchPlaceholder?: string;
  className?: string;
}

// Conserver 20 éléments par page comme dans la dernière version fournie
const ITEMS_PER_PAGE = 20;

export function DataTable({
  title,
  columns,
  data,
  onAdd,
  onEdit: onEditProp,
  onDelete,
  filters = [],
  searchPlaceholder = "Rechercher...",
  className,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);

  const categories = [
    { id: 1, name: 'Client' },
    { id: 2, name: 'Prospect' },
  ];

  const handleSaveContact = async (formData: any) => {
    try {
      setLoading(true);
      if (editingContact) {
        await api.put(`/prospects/${editingContact.id}`, formData);
      } else {
        await api.post('/prospects', formData);
      }
      setShowContactPopup(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Erreur save contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddPopup = () => {
    setEditingContact(null);
    setShowContactPopup(true);
  };

  const handleEditClick = (item: any) => {
    setEditingContact(item);
    setShowContactPopup(true);
    if (onEditProp) onEditProp(item);
  };

  const goToPage = (page: number) => setCurrentPage(page);

  const handleSort = (columnKey: string) => {
    setCurrentPage(1);
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setCurrentPage(1);
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        return String(item[key]).toLowerCase() === value.toLowerCase();
      });
      return matchesSearch && matchesFilters;
    });
  }, [data, searchTerm, activeFilters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortColumn) return 0;
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  else if (currentPage === 0 && totalPages > 0) setCurrentPage(1);

  return (
    <>
      {/* Configuration CSS pour masquer les barres de défilement (X et Y) */}
>>>>>>> 09129a42a3a3dd9c95cfc24af2efd4a7f0bda461
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
<<<<<<< HEAD
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="space-y-6">
        {/* Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]" onClick={handleAddContact}>
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
            onClick={handleDataRefresh}
            className="gap-2 ml-auto border-[#8675E1] border-2 text-[#8675E1]"
          >
            <RefreshCw className="h-4 w-4" /> Synchroniser
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Catégories */}
          <Card className="flex flex-col h-full max-h-[800px]">
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col h-full p-0">
              <div className="flex-grow space-y-3 overflow-y-auto hide-scrollbar px-6 pt-0 pb-3">
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
                          onClick={() => handleOpenCategoryDeletePopup(cat)}
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
              data={contactsWithNames} 
              filters={filters}
              searchPlaceholder="Rechercher par nom, email..."
              onEdit={handleEditContact}
              // 🔑 Utiliser la nouvelle fonction handleDeleteContact pour ouvrir la popup
              onDelete={handleDeleteContact} 
              onAdd={handleAddContact}
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

        {/* POPUP DE CONFIRMATION DE SUPPRESSION DE CATÉGORIE (Existante) */}
        <CategoryDeleteConfirmationPopup
          isOpen={isCategoryDeletePopupOpen}
          onClose={() => setIsCategoryDeletePopupOpen(false)}
          onConfirm={handleConfirmCategoryDelete}
          categoryName={categoryToDelete?.name || ''}
          loading={isDeletingCategory}
        />
        
        {/* 🔑 POPUP DE CONFIRMATION DE SUPPRESSION DE CONTACT (Nouveau Composant) */}
        <ContactDeleteConfirmationPopup
          isOpen={isContactDeletePopupOpen}
          onClose={() => setIsContactDeletePopupOpen(false)}
          onConfirm={handleConfirmDeleteContact}
          contactName={contactToDelete?.full_name || 'ce contact'} 
          loading={isDeletingContact}
        />
        
        {/* Popup Contact (si utilisée, décommenter si le composant ContactPopup existe) */}
        {/* <ContactPopup
          isOpen={isContactPopupOpen}
          onClose={() => setIsContactPopupOpen(false)}
          onSave={handleSaveContact}
          initialData={editingContact}
        /> */}

      </div>
    </Layout>
  );
};

export default Contacts;
=======
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

      {/* Rétablissement de la balise Card standard */}
      <Card className={cn('w-full max-h-[80vh] flex flex-col', className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button onClick={openAddPopup} className="gap-2 border">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            {filters.map((filter) => (
              <DropdownMenu key={filter.key}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
                    <Filter className="h-4 w-4" />
                    {filter.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleFilterChange(filter.key, '')}>Tous</DropdownMenuItem>
                  {filter.options.map((option) => (
                    <DropdownMenuItem key={option} onClick={() => handleFilterChange(filter.key, option)}>
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-grow p-0">

          {/* 🔑 Conteneur de Table Scrollable : Hauteur fixe et bordure inférieure */}


          {/* 🔑 Barre de Pagination : Compacte (py-3) et fixée sous le tableau */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 **py-3** shrink-0">
              <div className="text-sm text-muted-foreground">
                Affichage de {startIndex + 1} à {Math.min(endIndex, totalItems)} de {totalItems} résultats.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center justify-center text-sm font-medium text-foreground px-2">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ContactPopup
        isOpen={showContactPopup}
        onClose={() => {
          setShowContactPopup(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        categories={categories}
        initialData={editingContact}
      />
    </>
  );
}
>>>>>>> 09129a42a3a3dd9c95cfc24af2efd4a7f0bda461
