import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tempUser = localStorage.getItem('tempUser');
    if (tempUser) {
      const user = JSON.parse(tempUser);
      setEmail(user.email || '');
    }
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setMessage('Le code doit faire exactement 6 chiffres.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/email/verify`,  // Corrigé : /api/email/verify
        { email, code },
        { headers: { 'Content-Type': 'application/json' } }
      );

      setMessage(response.data.message);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.removeItem('tempUser');
        localStorage.removeItem('tempCode');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Code invalide. Vérifiez votre boîte de réception et réessayez.';
      setMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const tempCode = localStorage.getItem('tempCode') || '';

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-center">Vérification de l'e-mail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400 text-center">
            Nous avons envoyé un code à 6 chiffres à votre adresse e-mail. Entrez-le ci-dessous pour vérifier votre compte.
          </p>
          {tempCode && (
            <div className="text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded-md text-center">
              <strong>Code de test (supprimez en prod):</strong> {tempCode}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Code de vérification (6 chiffres)</Label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              className="text-center text-lg tracking-widest"
              disabled={isLoading}
            />
          </div>
          {message && (
            <p className={`text-sm ${message.includes('Erreur') || message.includes('invalide') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
          <Button
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6 || !email}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              'Vérifier le code'
            )}
          </Button>
          <p className="text-xs text-zinc-500 text-center">
            N'avez-vous pas reçu le code ? Vérifiez votre dossier spam ou inscrivez-vous à nouveau.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;