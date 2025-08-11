import React, { useState } from 'react';
import { ChevronDown, Search, Filter, Plus, Edit, Trash2 } from 'lucide-react';
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
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  filters?: { key: string; label: string; options: string[] }[];
  searchPlaceholder?: string;
  className?: string;
}

export function DataTable({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  filters = [],
  searchPlaceholder = "Rechercher...",
  className
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const filteredData = data.filter(item => {
    // Search filter
    const matchesSearch = Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Column filters
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      return String(item[key]).toLowerCase() === value.toLowerCase();
    });

    return matchesSearch && matchesFilters;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {filters.map((filter) => (
            <DropdownMenu key={filter.key}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filter.label}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => setActiveFilters(prev => ({ ...prev, [filter.key]: '' }))}
                >
                  Tous
                </DropdownMenuItem>
                {filter.options.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setActiveFilters(prev => ({ ...prev, [filter.key]: option }))}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "text-left py-3 px-4 text-sm font-medium text-muted-foreground",
                      column.sortable && "cursor-pointer hover:text-foreground"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && sortColumn === column.key && (
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          sortDirection === 'desc' && "rotate-180"
                        )} />
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index} className="border-b border-border hover:bg-secondary/50">
                  {columns.map((column) => (
                    <td key={column.key} className="py-3 px-4 text-sm">
                      {item[column.key]}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(item)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(item)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée trouvée
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}