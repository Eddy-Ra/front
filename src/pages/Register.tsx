import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, User, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';

const Register = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setIsLoading(false);
            return;
        }

        try {
            const newUser = {
                name,
                email,
                password: password, // Mot de passe en clair comme demandé
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                role: 'Rédacteur' // Rôle par défaut
            };

            await api.post('/users', newUser);

            toast({
                title: "Compte créé",
                description: "Votre compte a été créé avec succès.",
            });

            navigate('/login');

        } catch (err: any) {
            console.error("Erreur d'inscription:", err);
            const errorMessage = err.response?.data?.message || err.message || "Erreur lors de la création du compte.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 overflow-hidden relative">
            <div className="absolute inset-0 z-0 opacity-20 animate-bg-gradient">
                <div className="absolute inset-0 bg-gradient-primary from-rose-500 via-purple-500 to-cyan-500 blur-3xl opacity-50"></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <Card className="w-full bg-zinc-900 border-zinc-800 text-white shadow-2xl backdrop-blur-sm animate-fade-in">
                    <CardHeader className="space-y-4 text-center">
                        <CardTitle className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight">
                            <Brain className="w-10 h-10 text-purple-400" />
                            AutoProspect
                        </CardTitle>

                        <CardDescription className="text-zinc-400 text-base">
                            Créez votre compte
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-zinc-400">Nom Complet</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Votre nom"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-400">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-400">Mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 h-4 w-4 text-zinc-500 hover:text-white"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-zinc-400">Confirmer le mot de passe</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-900/30 border border-red-700/50 p-3">
                                    <p className="text-sm text-red-400 font-medium">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-primary from-purple-600 to-rose-500 text-white font-bold tracking-wide py-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
                                disabled={isLoading}
                            >
                                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    'S\'inscrire'
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex-col gap-4">
                        <p className="text-sm text-center text-zinc-400">
                            Déjà un compte ?{' '}
                            <a href="/login" className="font-semibold text-purple-400 hover:text-rose-500 transition-colors duration-200">
                                Connectez-vous
                            </a>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Register;
