import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Loader2, Brain, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [searchParams] = useSearchParams();
    const ts = searchParams.get('ts');
    const email = searchParams.get('email');
    const navigate = useNavigate();

    useEffect(() => {
        if (!email || !ts) {
            toast({
                title: "Erreur",
                description: "Lien de réinitialisation invalide.",
                variant: "destructive",
            });
            navigate('/login');
            return;
        }

        const now = Date.now();
        const requestTime = parseInt(ts);
        const diffMinutes = (now - requestTime) / (1000 * 60);

        if (diffMinutes > 2) {
            toast({
                title: "Lien expiré",
                description: "Ce lien de réinitialisation n'est plus valable (limite de 2 minutes).",
                variant: "destructive",
            });
            navigate('/login');
        }
    }, [email, ts, navigate]);

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
            // 1. Trouver l'utilisateur par e-mail
            const res = await api.get('/users');
            const users = res.data;
            const user = users.find((u: any) => u.email === email);

            if (!user) {
                setError("Utilisateur introuvable.");
                setIsLoading(false);
                return;
            }

            // 2. Mettre à jour le mot de passe
            await api.patch(`/users/${user.id}`, { password: password });

            setIsSuccess(true);
            toast({
                title: "Mot de passe modifié",
                description: "Votre mot de passe a été réinitialisé avec succès.",
            });

        } catch (err) {
            console.error("Erreur réinitialisation mot de passe:", err);
            setError("Une erreur est survenue lors de la modification du mot de passe.");
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
                            Définissez votre nouveau mot de passe
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {isSuccess ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                                </div>
                                <p className="text-zinc-300">
                                    Votre mot de passe a été mis à jour avec succès.
                                </p>
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => navigate('/login')}
                                >
                                    Aller à la connexion
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-zinc-400">Nouveau mot de passe</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500"
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
                                            className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500"
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
                                        'Réinitialiser le mot de passe'
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Link to="/login" className="text-sm text-zinc-400 hover:text-purple-400 transition-colors duration-200">
                            Retour à la connexion
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;
