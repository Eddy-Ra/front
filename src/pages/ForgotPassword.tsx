import React, { useState } from 'react';
import { Mail, Loader2, Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Vérifier si l'utilisateur existe
            const res = await api.get('/users');
            const users = res.data;
            const user = users.find((u: any) => u.email === email);

            if (!user) {
                toast({
                    title: "Erreur",
                    description: "Aucun utilisateur trouvé avec cet email.",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            // 2. Envoyer au webhook n8n
            const WEBHOOK_URL = 'https://n8n.omega-connect.tech/webhook/change-pass';

            await api.post(WEBHOOK_URL, {
                email: email,
                reset_link: `${window.location.origin}${window.location.pathname}#/reset-password?email=${encodeURIComponent(email)}&ts=${Date.now()}`,
                timestamp: new Date().toISOString()
            });

            setIsSent(true);
            toast({
                title: "E-mail envoyé",
                description: "Un lien de réinitialisation a été envoyé à votre adresse e-mail.",
            });

        } catch (err) {
            console.error("Erreur mot de passe oublié:", err);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de l'envoi de l'e-mail.",
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
                            Réinitialisez votre mot de passe
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {!isSent ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-400">
                                        Saisissez votre e-mail de connexion
                                    </Label>
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

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-primary from-purple-600 to-rose-500 text-white font-bold tracking-wide py-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
                                    disabled={isLoading}
                                >
                                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        'Envoyer le lien'
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center space-y-4 py-4">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                    <p className="text-green-400">
                                        Si cet email existe dans notre système, vous recevrez un lien de réinitialisation sous peu.
                                    </p>
                                </div>
                                <p className="text-sm text-zinc-400">
                                    N'oubliez pas de vérifier vos courriers indésirables (spams).
                                </p>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter>
                        <Link to="/login" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-purple-400 transition-colors duration-200">
                            <ArrowLeft className="w-4 h-4" />
                            Retour à la connexion
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
