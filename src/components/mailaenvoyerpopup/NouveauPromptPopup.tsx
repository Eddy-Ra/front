import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, AlertCircle, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/api/api'; // ✅ utilisation de l'instance Axios

interface PromptFormData {
  nom: string;
  categorie: string;
  texte: string;
}

interface Category {
  id: string;
  name: string;
}

interface NouveauPromptPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PromptFormData) => Promise<void>;
  initialData?: any | null;
  onRefreshPrompts?: () => Promise<void>;
}

export const NouveauPromptPopup: React.FC<NouveauPromptPopupProps> = ({ isOpen, onClose, onSave, initialData, onRefreshPrompts }) => {
  const [isPromptsLoading, setIsPromptsLoading] = useState(false);
  
  const [formData, setFormData] = useState<PromptFormData>({
    nom: '',
    categorie: '',
    texte: '',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 Charger dynamiquement les catégories depuis l'API avec Axios
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      setError(null);
      try {
        const { data } = await api.get('/categories'); // ✅ utilisation de l'api Axios
        setCategories(data);
      } catch (err: any) {
        console.error('Erreur de chargement des catégories :', err);
        setError("Impossible de charger les catégories. Vérifiez le serveur API.");
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

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
  const buttonText = isEditMode ? 'Sauvegarder les modifications' : 'Générer avec IA';

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
    setError(null);

    try {
      if (formData.nom.length > 100) throw new Error('Le nom ne doit pas dépasser 100 caractères');
      if (formData.texte.length > 5000) throw new Error('Le texte ne doit pas dépasser 5000 caractères');

      const webhookUrl = 'https://wfw.omega-connect.tech/webhook-test/ace774ca-91e7-4ca0-9121-ee401829322501';

      // ✅ Utilisation de l'API Axios pour le webhook
      await api.post(webhookUrl, {
        nom: formData.nom,
        categorie: formData.categorie,
        texte: formData.texte,
        timestamp: new Date().toISOString(),
        mode: isEditMode ? 'edit' : 'create',
      });

      // Délai de 10 secondes avant de rafraîchir les prompts
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Appel de la fonction pour récupérer les nouveaux prompts
      if (onRefreshPrompts) {
        await onRefreshPrompts();
      }

      await onSave(formData);
      onClose();
    } catch (error: any) {
      console.error(error);
      setError(error.response?.data?.message || error.message || 'Erreur inconnue');
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
                  <Bot className="h-4 w-4" /> 
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