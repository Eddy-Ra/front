import React, { useState, useMemo } from 'react';
import { ChevronDown, Search, Filter, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Largeurs fixes pour les colonnes (inchangé)
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
  // 🔑 NOUVELLE PROP : Pour indiquer l'état de chargement
  isLoading?: boolean; 
  onAdd: () => void; 
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  filters?: { key: string; label: string; options: string[] }[];
  searchPlaceholder?: string;
  className?: string;
}

const ITEMS_PER_PAGE = 50;

export function DataTable({
  title,
  columns,
  data,
  isLoading = false, // 🔑 Récupérer isLoading (false par défaut)
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
  
  const handleEditClick = (item: any) => {
    onEditProp(item); 
  };
  
  const handleDeleteClick = (item: any) => {
    onDelete(item);
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
    // 🔑 OPTIMISATION : Si chargement, on retourne un tableau vide pour ne pas faire de calcul coûteux
    if (isLoading) return [];
    
    return data.filter((item) => {
      const matchesSearch = Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        
        // 🔑 CORRECTION MINEURE : S'assurer que la catégorie est bien comparée (si elle est définie)
        const itemValue = item[key];
        if (itemValue === undefined || itemValue === null) return false;
        
        return String(itemValue).toLowerCase() === value.toLowerCase();
      });
      return matchesSearch && matchesFilters;
    });
  }, [data, searchTerm, activeFilters, isLoading]); // 🔑 Ajouter isLoading comme dépendance

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      if (!sortColumn) return 0;
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === bValue) return 0;
      // Gérer les valeurs null/undefined pour le tri
      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      
      const comparison = String(aValue) > String(bValue) ? 1 : -1;
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
  
  // 🔑 LOGIQUE AJOUTÉE : Si le chargement est actif, ne pas tenter de naviguer
  if (isLoading && currentPage !== 1) setCurrentPage(1);


  return (
    <>
      {/* Styles (inchangés) */}
      <style jsx global>{`
        /* ... styles inchangés ... */
        .hide-scrollbar-y::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar-y {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .custom-scroll-x::-webkit-scrollbar {
          height: 8px;
          background-color: transparent;
        }

        .custom-scroll-x::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
          margin: 0 10px;
        }

        .custom-scroll-x::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8675E1 0%, #6A56D6 100%);
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .custom-scroll-x::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #6A56D6 0%, #5A46C6 100%);
          transform: scale(1.05);
        }

        .custom-scroll-x {
          scrollbar-width: thin;
          scrollbar-color: #8675E1 transparent;
        }
      `}</style>

      <Card className='w-full h-auto flex flex-col rounded-xl border bg-card text-card-foreground shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl pb-5'>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button onClick={onAdd} className="gap-2 border" disabled={isLoading}>
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search et Filters */}
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
                disabled={isLoading} // 🔑 Désactiver la recherche pendant le chargement
              />
            </div>

            {filters.map((filter) => (
              <DropdownMenu key={filter.key}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 border-[#8675E1] border-2 text-[#8675E1]"
                    disabled={isLoading} // 🔑 Désactiver les filtres pendant le chargement
                  >
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
          <div className="h-[60vh] overflow-y-auto overflow-x-hidden hide-scrollbar-y">
            
            {/* 🔑 CONDITIONNEL : Affichage du spinner si isLoading est vrai */}
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              // 🔑 Affichage de la table uniquement si PAS en chargement
              <div className="h-full overflow-x-auto custom-scroll-x">
                <table className="min-w-full table-fixed">
                  <thead>
                    <tr className="border-b border-border sticky top-0 bg-background z-10">
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className={cn(
                            'text-left py-3 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap',
                            COLUMN_WIDTHS[column.key],
                            column.sortable && 'cursor-pointer hover:text-foreground'
                          )}
                          onClick={() => column.sortable && handleSort(column.key)}
                        >
                          <div className="flex items-center gap-1">
                            {column.label}
                            {column.sortable && sortColumn === column.key && (
                              <ChevronDown
                                className={cn('h-4 w-4 transition-transform', sortDirection === 'desc' && 'rotate-180')}
                              />
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-[120px] text-left py-3 px-4 text-sm font-medium text-muted-foreground sticky right-0 bg-background z-20">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedData.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-border hover:bg-secondary/50">
                        {columns.map((column) => (
                          <td
                            key={column.key}
                            className={cn(
                              'py-3 px-4 text-sm overflow-hidden text-ellipsis whitespace-nowrap',
                              COLUMN_WIDTHS[column.key]
                            )}
                          >
                            {/* Affichage du contenu de la cellule */}
                            {item[column.key]}
                          </td>
                        ))}
                        <td className="w-[120px] py-3 px-4 sticky right-0 bg-card hover:bg-secondary/50">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(item)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Afficher le message "Aucune donnée" uniquement si ce n'est pas en chargement ET que la liste est vide */}
            {!isLoading && paginatedData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Aucune donnée trouvée</div>
            )}
          </div>

          {/* Barre de Pagination (désactivée si chargement) */}
          {totalPages > 1 && !isLoading && (
            <div className="flex justify-between items-center px-6 mt-3 shrink-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading} // Désactivé si chargement
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
                  disabled={currentPage === totalPages || isLoading} // Désactivé si chargement
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}