import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/api/api';

interface Category {
  id: string;
  name: string;
}

interface ContactFormData {
  full_name: string;
  email: string;
  company: string;
  category_id: string;
  source: string;
}

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContactFormData) => Promise<void>;
  initialData?: any | null;
}

export const ContactPopup: React.FC<ContactPopupProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    full_name: '',
    email: '',
    company: '',
    category_id: '',
    source: 'Manuel', // ✅ valeur par défaut en mode ajout
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  // 🔹 Charger les catégories
  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories :', error);
      } finally {
        setIsFetchingCategories(false);
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  // 🔹 Préremplir le formulaire lors de l’édition
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode édition
        setFormData({
          full_name: initialData.full_name || '',
          email: initialData.email || '',
          company: initialData.company || '',
          category_id: initialData.category_id ? String(initialData.category_id) : '',
          source: initialData.source || '',
        });
      } else {
        // Mode ajout
        setFormData({
          full_name: '',
          email: '',
          company: '',
          category_id: '',
          source: 'Manuel',
        });
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const title = isEditMode ? 'Modifier le contact' : 'Ajouter un nouveau contact';
  const buttonText = isEditMode ? 'Sauvegarder les modifications' : 'Enregistrer le Contact';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCategorySelect = (value: string) => {
    setFormData(prev => ({ ...prev, category_id: value }));
  };

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.category_id) return;
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contact :', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.full_name.trim() !== '' && formData.category_id.trim() !== '';

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 mt-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom Complet <span className="text-destructive">*</span></Label>
              <Input
                id="full_name"
                placeholder="Nom et prénom"
                value={formData.full_name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@societe.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Société */}
            <div className="space-y-2">
              <Label htmlFor="company">Société</Label>
              <Input
                id="company"
                placeholder="Nom de la société"
                value={formData.company}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Catégorie <span className="text-destructive">*</span></Label>
              <Select
                onValueChange={handleCategorySelect}
                value={formData.category_id}
                disabled={isLoading || isFetchingCategories}
              >
                <SelectTrigger id="category_id" className="w-full">
                  <SelectValue placeholder={isFetchingCategories ? "Chargement..." : "Sélectionner une catégorie"} />
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

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                className="bg-muted/50 cursor-not-allowed text-muted-foreground"
                disabled
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
              className="gap-2 bg-gradient-primary border-2 border-primary-hover text-black dark:text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {buttonText}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
