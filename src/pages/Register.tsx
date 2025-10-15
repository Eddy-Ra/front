import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, KeyRound, Brain, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import axios from 'axios';

axios.defaults.withCredentials = true;

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/register`, {  // Corrigé : /api/register
        name,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      if (response.data.message) {
        setSuccess(response.data.message);
        localStorage.setItem('tempUser', JSON.stringify(response.data.user));
        if (response.data.code) {
          localStorage.setItem('tempCode', response.data.code);
        }
        setTimeout(() => {
          window.location.href = '/verify-email';
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Créer un compte</CardTitle>
          <CardDescription className="text-center">
            Rejoignez OmegaBrain dès aujourd'hui
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Au moins 8 caractères"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 opacity-70 hover:opacity-100"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Répétez votre mot de passe"
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 opacity-70 hover:opacity-100"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-red-900/30 border border-red-700/50 p-3 mt-4">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-900/30 border border-green-700/50 p-3 mt-4">
                <p className="text-sm text-green-400 font-medium">{success}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full mt-6 bg-gradient-primary from-cyan-600 to-purple-500 text-white font-bold tracking-wide py-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création du compte...
                </>
              ) : (
                'S\'inscrire'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-sm text-center text-zinc-400">
            Vous avez déjà un compte ?{' '}
            <a href="/login" className="font-semibold text-cyan-400 hover:text-purple-500 transition-colors duration-200">
              Connectez-vous
            </a>
          </p>
          <div className="p-3 w-full bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-400 text-center text-sm">
            <strong>Conseil:</strong> Utilisez un mot de passe sécurisé d'au moins 8 caractères
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;