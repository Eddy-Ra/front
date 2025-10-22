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
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
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
