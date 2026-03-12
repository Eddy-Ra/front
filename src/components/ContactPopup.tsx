import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  categories: Category[];
  loading?: boolean;
}

export const ContactPopup: React.FC<ContactPopupProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  categories,
  loading = false 
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    full_name: '',
    email: '',
    company: '',
    category_id: '',
    source: 'Manuel',
  });

  // 🔹 Préremplir le formulaire lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode édition
        setFormData({
          full_name: initialData.full_name || '',
          email: initialData.email || '',
          company: initialData.company || '',
          category_id: initialData.category_id ? String(initialData.category_id) : '',
          source: initialData.source || 'Manuel',
        });
      } else {
        // Mode ajout - réinitialiser
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
    
    try {
      await onSave(formData);
      // La fermeture est gérée par le parent après la sauvegarde
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du contact :', error);
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
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category_id">Catégorie <span className="text-destructive">*</span></Label>
              <Select
                onValueChange={handleCategorySelect}
                value={formData.category_id}
                disabled={loading}
              >
                <SelectTrigger id="category_id" className="w-full">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            className="w-full gap-2" 
            onClick={handleSave} 
            disabled={!isFormValid || loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {buttonText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};