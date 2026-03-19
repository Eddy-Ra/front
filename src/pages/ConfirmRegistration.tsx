import React, { useState, useEffect } from 'react';
import { Loader2, Brain, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';

const ConfirmRegistration = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [errorDetail, setErrorDetail] = useState('');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    const ts = searchParams.get('ts');

    useEffect(() => {
        const confirmAndCreateAccount = async () => {
            
            if (!name || !email || !password || !ts) {
                setStatus('error');
                setIsLoading(false);
                return;
            }

            // 1. Vérifier l'expiration (2 minutes)
            const now = Date.now();
            const requestTime = parseInt(ts);
            const diffMinutes = (now - requestTime) / (1000 * 60);

            /*if (diffMinutes > 2) {
                setStatus('expired');
                setIsLoading(false);
                return;
            }*/

            try {
                // 2. Créer le compte
                await api.post('/users', {
                    name:name,
                    email:email,
                    password:password,
                    password_confirmation:password,
                    role: 'Rédacteur',
                });

                setStatus('success');
                toast({
                    title: "Compte activé",
                    description: "Votre compte a été créé avec succès.",
                });
            } catch (err) {
                console.error("Erreur de confirmation:", err);
                setStatus('error');
                setErrorDetail(JSON.stringify(err.response?.data || err.message));
            } finally {
                setIsLoading(false);
            }
        };

        confirmAndCreateAccount();
    }, [name, email, password, ts]);

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
                    </CardHeader>

                    <CardContent className="py-6">
                        {status === 'loading' && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                                <p className="text-zinc-400">Finalisation de votre inscription...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Félicitations !</h3>
                                    <p className="text-zinc-400">
                                        Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => navigate('/login')}
                                >
                                    Se connecter
                                </Button>
                            </div>
                        )}

                        {status === 'expired' && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <XCircle className="w-16 h-16 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Lien expiré</h3>
                                    <p className="text-zinc-400">
                                        Le lien de confirmation est devenu invalide (limite de 2 minutes dépassée).
                                    </p>
                                </div>
                                <Button
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                                    onClick={() => navigate('/register')}
                                >
                                    Recommencer l'inscription
                                </Button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <XCircle className="w-16 h-16 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-white">Erreur</h3>
                                    <p className="text-zinc-400">
                                        Une erreur est survenue lors de la confirmation de votre compte.
                                   
                                    </p>
                                    
                                </div>
                                <Button
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                                    onClick={() => navigate('/register')}
                                >
                                    Retour à l'inscription
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ConfirmRegistration;
