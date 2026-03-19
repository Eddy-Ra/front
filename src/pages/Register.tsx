import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Loader2, User, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, Link } from 'react-router-dom';
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
    const [isEmailSent, setIsEmailSent] = useState(false);
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
            // 1. Vérifier si l'e-mail existe déjà
            const res = await api.get('/users');
            const users = res.data;
            const existingUser = users.find((u: any) => u.email === email);

            if (existingUser) {
                toast({
                    title: "Erreur d'inscription",
                    description: "Cette adresse e-mail est déjà utilisée.",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            // 2. Envoyer au webhook n8n pour confirmation
            //const WEBHOOK_URL = 'https://n8n.omega-connect.tech/webhook/58542790-7cf2-4f78-8e26-5bade7374186';
             const WEBHOOK_URL = 'https://n8n.projets-omega.net/webhook-test/58542790-7cf2-4f78-8e26-5bade7374186';

            const confirmationLink = `${window.location.origin}${window.location.pathname}#/confirm-registration?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&ts=${Date.now()}`;

            await api.post(WEBHOOK_URL, {
                email: email,
                name:name,
                password:password,
                reset_link: confirmationLink,
                timestamp: new Date().toISOString()
            });

            setIsEmailSent(true);
            toast({
                title: "E-mail envoyé",
                description: "Un lien de confirmation vous a été envoyé par e-mail.",
            });

        } catch (err: any) {
            console.error("Erreur d'inscription:", err);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de l'inscription.",
                variant: "destructive",
            });
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
                        {isEmailSent ? (
                            <div className="text-center space-y-6 py-4">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
                                        <Mail className="w-8 h-8 text-purple-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Vérifiez vos e-mails</h3>
                                    <p className="text-zinc-400">
                                        Un lien de confirmation a été envoyé à <span className="text-purple-400 font-medium">{email}</span>.
                                    </p>
                                    <p className="text-xs text-zinc-500 italic">
                                        Valable pendant 2 minutes.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full border-zinc-700 text-zinc-300 hover:text-white"
                                    onClick={() => setIsEmailSent(false)}
                                >
                                    Modifier mes informations
                                </Button>
                            </div>
                        ) : (
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
                        )}
                    </CardContent>

                    <CardFooter className="flex-col gap-4">
                        <p className="text-sm text-center text-zinc-400">
                            Déjà un compte ?{' '}
                            <Link to="/login" className="font-semibold text-purple-400 hover:text-rose-500 transition-colors duration-200">
                                Connectez-vous
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Register;
