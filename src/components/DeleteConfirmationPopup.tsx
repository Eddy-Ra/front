import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Assurez-vous d'avoir cn pour les classes conditionnelles

interface DeleteConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  loading: boolean;
}

export const DeleteConfirmationPopup: React.FC<DeleteConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md shadow-2xl border border-input transform transition-all duration-300 scale-100 opacity-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-warning font-semibold"> {/* Utilisation de text-warning ou une couleur personnalisée */}
            <AlertTriangle className="h-5 w-5 text-warning" />
            Confirmer la Suppression
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={loading} className="hover:bg-accent">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <p className="text-sm text-foreground/80 leading-relaxed"> {/* Texte plus clair */}
            Vous êtes sur le point de supprimer la catégorie "
            <span className="font-bold text-foreground/80 leading-relaxed">{categoryName}</span>".
            <br />
            Cette action est <span className="font-bold text-warning">irréversible</span> et tous les contacts associés perdront cette classification.
            <br />
            Voulez-vous vraiment continuer ?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-border"> {/* Séparateur et padding */}
            <Button
              variant="outline" onClick={onClose} disabled={loading}
              className="px-6 py-2"
            >
              Annuler
            </Button>
            <Button
              onClick={onConfirm}
              className={cn(
                "px-6 py-2 gap-2",
                "bg-red-700 hover:bg-red-800 gap-2 bg-gradient-primary border-2 border-primary-hover", // Un rouge plus profond pour le dark mode
                "dark:bg-red-600 dark:hover:bg-red-700", // Un rouge similaire pour le light mode
                loading && "opacity-70 cursor-not-allowed" // Désactivation visuelle
              )}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};