import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/api/api';

interface PromptFormData {
  nom: string;
  categorie: string;
  contenu: string;
}

interface Category {
  id: string;
  name: string;
}

interface Prompt {
  id: number;
  nom: string;
  contenu: string;
  categorie: string;
}

interface ModifierPromptPopupProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onSuccess: () => void;
}

export const ModifierPromptPopup: React.FC<ModifierPromptPopupProps> = ({ 
  isOpen, 
  onClose, 
  prompt,
  onSuccess 
}) => {
  const [formData, setFormData] = useState<PromptFormData>({
    nom: '',
    categorie: '',
    contenu: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:8000/api/categories');
        if (!response.ok) {
          throw new Error(`Erreur ${response.status} lors du chargement des catégories`);
        }
        const data = await response.json();
        setCategories(data);
      } catch (err: any) {
        console.error('Erreur de chargement des catégories :', err);
        setError("Impossible de charger les catégories.");
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Initialiser le formulaire avec les données du prompt
  useEffect(() => {
    if (isOpen && prompt) {
      setFormData({
        nom: prompt.nom || '',
        categorie: prompt.categorie || '',
        contenu: prompt.contenu || '',
      });
    }
  }, [prompt, isOpen]);

  if (!isOpen || !prompt) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCategorySelect = (value: string) => {
    setFormData(prev => ({ ...prev, categorie: value }));
  };

  const handleSave = async () => {
    if (!formData.nom.trim() || !formData.categorie || !formData.contenu.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (formData.nom.length > 100) throw new Error('Le nom ne doit pas dépasser 100 caractères');
      if (formData.contenu.length > 5000) throw new Error('Le contenu ne doit pas dépasser 5000 caractères');

      await api.patch(`/prompt/${prompt.id}`, {
        nom: formData.nom,
        categorie: formData.categorie,
        contenu: formData.contenu,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur modification prompt:', error);
      setError(error.message || 'Erreur lors de la modification');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.nom.trim() !== '' && formData.categorie !== '' && formData.contenu.trim() !== '';

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
          <CardTitle>Modifier le prompt</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="nom">Nom <span className="text-destructive">*</span></Label>
              <Input
                id="nom"
                placeholder="Nom du prompt"
                value={formData.nom}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie <span className="text-destructive">*</span></Label>
              <Select
                onValueChange={handleCategorySelect}
                value={formData.categorie}
                disabled={isLoading || loadingCategories}
              >
                <SelectTrigger id="categorie" className="w-full">
                  <SelectValue placeholder={loadingCategories ? 'Chargement...' : 'Sélectionner une catégorie'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contenu */}
            <div className="space-y-2">
              <Label htmlFor="contenu">Contenu <span className="text-destructive">*</span></Label>
              <Textarea
                id="contenu"
                placeholder="Entrez le contenu du prompt..."
                value={formData.contenu}
                onChange={handleChange}
                disabled={isLoading}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
