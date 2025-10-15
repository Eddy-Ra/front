import React, { useState } from 'react';
import { Mail, Loader2, KeyRound, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';

const VerifyCode = () => {
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            // Obtenir le cookie CSRF
            await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

            // Envoyer la requête de vérification
            await axios.post('http://localhost:8000/api/verify-email', {
                email,
                code,
            }, { withCredentials: true });

            setSuccess('Email vérifié avec succès ! Vous pouvez maintenant vous connecter.');
            setCode('');
            setEmail('');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Code de vérification incorrect.');
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
                        <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-primary from-purple-500 to-rose-500 rounded-2xl shadow-lg transform hover:scale-110 transition-transform duration-300">
                            <KeyRound className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="flex items-center justify-center gap-3 text-4xl font-extrabold tracking-tight">
                            <Brain className="w-10 h-10 text-purple-400" />
                            OmegaBrain
                        </CardTitle>
                        <CardDescription className="text-zinc-400 text-base">
                            Vérifiez votre email
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <div className="space-y-2 animate-slide-in-up delay-100">
                                <Label htmlFor="code" className="text-zinc-400">
                                    Code de vérification
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="Entrez le code reçu"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors duration-200"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-md bg-red-900/30 border border-red-700/50 p-3 animate-shake">
                                    <p className="text-sm text-red-400 font-medium">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="rounded-md bg-green-900/30 border border-green-700/50 p-3 animate-fade-in">
                                    <p className="text-sm text-green-400 font-medium">{success}</p>
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
                                    'Vérifier'
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex-col gap-4">
                        <p className="text-sm text-center text-zinc-400">
                            Retour à{' '}
                            <a href="/login" className="font-semibold text-purple-400 hover:text-rose-500 transition-colors duration-200">
                                Se connecter
                            </a>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default VerifyCode;