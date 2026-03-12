import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirection automatique vers la page de login
    navigate('/login');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">CRM Pro</h1>
        <p className="text-xl">Chargement...</p>
      </div>
    </div>
  );
};

export default Index;
