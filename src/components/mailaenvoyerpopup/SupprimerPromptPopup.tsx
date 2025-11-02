import React, { useState } from 'react';
import { Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/api/api';

interface Prompt {
  id: number;
  nom: string;
}

interface SupprimerPromptPopupProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onSuccess: () => void;
  nombreMailsGeneres: number; // Nombre de mails générés associés à ce prompt
}

export const SupprimerPromptPopup: React.FC<SupprimerPromptPopupProps> = ({
  isOpen,
  onClose,
  prompt,
  onSuccess,
  nombreMailsGeneres
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!prompt) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/prompt/${prompt.id}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur suppression prompt:', error);
      setError(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !prompt) return null;

  // Vérifier si le prompt a des mails générés associés
  const hasGeneratedMails = nombreMailsGeneres > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasGeneratedMails ? 'Suppression impossible' : 'Confirmer la suppression'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasGeneratedMails ? (
              <>
                Le prompt <strong>"{prompt.nom}"</strong> ne peut pas être supprimé car il est utilisé 
                par <strong>{nombreMailsGeneres}</strong> mail(s) généré(s).
                <br /><br />
                Veuillez d'abord supprimer ou modifier les mails associés avant de supprimer ce prompt.
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer le prompt <strong>"{prompt.nom}"</strong> ?
                Cette action est irréversible.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {hasGeneratedMails ? 'Fermer' : 'Annuler'}
          </Button>
          {!hasGeneratedMails && (
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
