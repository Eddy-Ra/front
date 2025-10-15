import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, KeyRound, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import axios from 'axios';

axios.defaults.withCredentials = true;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Erreur lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    setIsGoogleLoading(true);
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`; // Changé en /api/auth/google
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-20 animate-bg-gradient">
        <div className="absolute inset-0 bg-gradient-primary from-rose-500 via-purple-500 to-cyan-500 blur-3xl opacity-50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full bg-zinc-900 border-zinc-800 text-white shadow-2xl backdrop-blur-sm animate-fade-in">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-primary from-purple-500 to-rose-500 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight">
              <Brain className="w-10 h-10 text-purple-400" />
              OmegaBrain
            </CardTitle>
            <CardDescription className="text-zinc-400 text-base">
              Connectez-vous à votre espace d'administration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              variant="outline"
              className="w-full border-zinc-700 text-white hover:bg-zinc-800 gap-2 py-6 font-bold tracking-wide relative overflow-hidden group transition-all duration-300"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <Icons.google className="h-5 w-5" />
              {isGoogleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Se connecter avec Google'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">Ou continuez avec</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 animate-slide-in-up">
                <Label htmlFor="email" className="text-zinc-400">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@crm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors duration-200"
                    required
                  />
                </div>
              </div>

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
              </div>

              {error && (
                <div className="rounded-md bg-red-900/30 border border-red-700/50 p-3 animate-shake">
                  <p className="text-sm text-red-400 font-medium">{error}</p>
                </div>
              )}

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
              <a href="/register" className="font-semibold text-purple-400 hover:text-rose-500 transition-colors duration-200">
                Inscrivez-vous
              </a>
            </p>
            <div className="p-3 w-full bg-zinc-800 rounded-lg border border-zinc-700 text-zinc-400 text-center text-sm">
              <strong>Test:</strong> <span>admin@crm.com</span> / <span>admin123</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;