import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, KeyRound, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/ui/icons'; // Assurez-vous d'avoir un composant Icons avec l'icône Google

import { api } from '@/api/api';
import bcrypt from 'bcryptjs';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Récupérer tous les utilisateurs
      const res = await api.get('/users');
      const users = res.data;

      // 2. Trouver l'utilisateur par email
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        setError('Email incorrect');
        setIsLoading(false);
        return;
      }

      // 3. Vérifier le mot de passe hashé
      const isMatch = await password === user.password;

      if (isMatch) {
        // Mettre à jour le statut actif
        try {
          await api.patch(`/users/${user.id}`, { is_active: true });
          // Mettre à jour l'objet user local aussi
          user.is_active = true;
        } catch (e) {
          console.error("Erreur mise à jour statut", e);
        }

        // Stocker les infos utilisateur (simple pour l'instant)
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard');
      } else {
        setError('Mot de passe incorrect');
      }

    } catch (err) {
      console.error("Erreur de connexion", err);
      setError("Erreur lors de la connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    // Logique de connexion Google ici
    setTimeout(() => {
      console.log('Connexion via Google...');
      setIsGoogleLoading(false);
      // Redirection ou traitement après la connexion Google
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background animé avec un dégradé */}
      <div className="absolute inset-0 z-0 opacity-20 animate-bg-gradient">
        <div className="absolute inset-0 bg-gradient-primary from-rose-500 via-purple-500 to-cyan-500 blur-3xl opacity-50"></div>
      </div>

      {/* Conteneur principal de la carte */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full bg-zinc-900 border-zinc-800 text-white shadow-2xl backdrop-blur-sm animate-fade-in">
          <CardHeader className="space-y-4 text-center">
            {/* <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-primary from-purple-500 to-rose-500 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
              <KeyRound className="h-8 w-8 text-white" />
            </div> */}
            <CardTitle className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight">
              <Brain className="w-10 h-10 text-purple-400" />
              AutoProspect
            </CardTitle>

            <CardDescription className="text-zinc-400 text-base">
              Connectez-vous à votre espace d'administration
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {/* Bouton de connexion Google */}
            {/* <Button
              variant="outline"
              className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 transition-colors duration-200 group relative overflow-hidden"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
            >
              <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
              {isGoogleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion avec Google...
                </>
              ) : (
                <>
                  <Icons.google className="mr-2 h-4 w-4" />
                  Connexion avec Google
                </>
              )}
            </Button> */}

            {/* Séparateur OR */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">
                  Ou continuer avec
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Champ email */}
              <div className="space-y-2 animate-slide-in-up">
                <Label htmlFor="email" className="text-zinc-400">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Votre email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors duration-200"
                    required
                  />
                </div>
              </div>

              {/* Champ mot de passe */}
              <div className="space-y-2 animate-slide-in-up delay-100">
                <Label htmlFor="password" className="text-zinc-400">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-zinc-500 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-xs text-purple-400 hover:text-rose-500 transition-colors duration-200"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="rounded-md bg-red-900/30 border border-red-700/50 p-3 animate-shake">
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Bouton de connexion */}
              <Button
                type="submit"
                className="w-full bg-gradient-primary from-purple-600 to-rose-500 text-white font-bold tracking-wide py-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
                disabled={isLoading || isGoogleLoading}
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <p className="text-sm text-center text-zinc-400">
              Vous n'avez pas de compte ?{' '}
              <Link to="/register" className="font-semibold text-purple-400 hover:text-rose-500 transition-colors duration-200">
                Inscrivez-vous
              </Link>
            </p>
            {/* Informations de test */}

          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;