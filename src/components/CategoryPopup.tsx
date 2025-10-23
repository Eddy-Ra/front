import React, { useState, useEffect } from 'react';
import { X, Save, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/api/api'; // <-- Import de ton instance Axios centralisée

const COLOR_OPTIONS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
];

interface CategoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  initialData: { id: number; name: string; color: string } | null;
}

export const CategoryPopup: React.FC<CategoryPopupProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCategoryName(initialData.name);
      setSelectedColor(initialData.color);
    } else {
      setCategoryName('');
      setSelectedColor(COLOR_OPTIONS[0]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const title = isEditMode ? "Modifier la Catégorie" : "Créer une Nouvelle Catégorie";
  const buttonText = isEditMode ? "Sauvegarder les modifications" : "Enregistrer la Catégorie";

const handleSave = async () => {
  if (!categoryName.trim()) return;
  setLoading(true);

  try {
    onSave(categoryName.trim(), selectedColor); // 🔥 on laisse le parent gérer l'appel API
    setCategoryName('');
    setSelectedColor(COLOR_OPTIONS[0]);
    onClose();
  } catch (error) {
    console.error("Erreur dans le popup:", error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Nom de la catégorie</label>
            <Input
              placeholder="Ex: Partenaires, VIP, Clients Locaux"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Couleur associée
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <div
                  key={color}
                  className={cn(
                    "w-8 h-8 rounded-full cursor-pointer transition-transform duration-200 border-2 border-transparent",
                    color,
                    selectedColor === color && "ring-2 ring-offset-2 ring-ring"
                  )}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Sélectionner la couleur ${color.replace('bg-', '')}`}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!categoryName.trim() || loading}
            className="w-full gap-2 bg-gradient-primary border-2 border-primary-hover text-white dark:text-black"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Sauvegarde en cours...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {buttonText}
              </>
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};
