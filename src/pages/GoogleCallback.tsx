// Créez un nouveau composant GoogleCallback.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setError('Erreur Google OAuth: ' + error);
      return;
    }

    if (code) {
      // Appeler une API Laravel pour valider le code
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/callback?code=${code}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then(response => {
          if (!response.ok) throw new Error('Échec du callback: ' + response.status);
          return response.json();
        })
        .then(data => {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard');
        })
        .catch(err => {
          setError('Erreur lors du traitement du callback: ' + err.message);
        });
    }
  }, [searchParams, navigate]);

  return (
    <div>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <p>Traitement de la connexion Google...</p>
      )}
    </div>
  );
};

export default GoogleCallback;