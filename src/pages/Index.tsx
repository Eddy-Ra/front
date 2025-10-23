import React, { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // Redirection automatique vers la page de login
    window.location.href = '/login';
  }, []);

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
