import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PromptFormData {
  nom: string;
  categorie: string;
  texte: string;
}

interface NouveauPromptPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromptFormData) => Promise<void>;
  initialData?: any | null;
}

const categories = [
  { id: 'tech', name: 'Tech' },
  { id: 'commerce', name: 'Commerce' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'design', name: 'Design' },
  { id: 'autre', name: 'Autre' },
];

export const NouveauPromptPopup: React.FC<NouveauPromptPopupProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<PromptFormData>({
    nom: '',
    categorie: '',
    texte: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          nom: initialData.nom || '',
          categorie: initialData.categorie || '',
          texte: initialData.texte || '',
        });
      } else {
        setFormData({
          nom: '',
          categorie: '',
          texte: '',
        });
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const title = isEditMode ? 'Modifier le prompt' : 'Nouveau prompt';
  const buttonText = isEditMode ? 'Sauvegarder les modifications' : 'Enregistrer le prompt';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCategorySelect = (value: string) => {
    setFormData(prev => ({ ...prev, categorie: value }));
  };

  const handleSave = async () => {
    if (!formData.nom.trim() || !formData.categorie || !formData.texte.trim()) return;
    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du prompt :', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.nom.trim() !== '' && formData.categorie !== '' && formData.texte.trim() !== '';

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
                disabled={isLoading}
              >
                <SelectTrigger id="categorie" className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
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

            {/* Texte */}
            <div className="space-y-2">
              <Label htmlFor="texte">Texte <span className="text-destructive">*</span></Label>
              <Textarea
                id="texte"
                placeholder="Entrez le contenu du prompt..."
                value={formData.texte}
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
              className="gap-2 bg-gradient-primary border-2 border-primary-hover"
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