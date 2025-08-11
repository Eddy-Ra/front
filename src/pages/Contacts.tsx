import React, { useState } from 'react';
import { Plus, Download, Upload, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Contacts = () => {
  // SECTION: Données mockées des contacts
  const [contacts] = useState([
    {
      id: 1,
      nom: 'Jean Dupont',
      email: 'jean.dupont@entreprise.com',
      telephone: '+33 1 23 45 67 89',
      source: 'Google Maps',
      categorie: 'Tech',
      statut: 'Nouveau',
      dateAjout: '2024-01-15'
    },
    {
      id: 2,
      nom: 'Marie Martin',
      email: 'marie.martin@commerce.fr',
      telephone: '+33 6 78 90 12 34',
      source: 'Phantombuster',
      categorie: 'Commerce',
      statut: 'Contacté',
      dateAjout: '2024-01-14'
    },
    {
      id: 3,
      nom: 'Pierre Bernard',
      email: 'p.bernard@services.com',
      telephone: '+33 2 34 56 78 90',
      source: 'Manuel',
      categorie: 'Services',
      statut: 'Intéressé',
      dateAjout: '2024-01-13'
    },
    {
      id: 4,
      nom: 'Sophie Leroy',
      email: 'sophie.leroy@startup.io',
      telephone: '+33 7 89 01 23 45',
      source: 'Google Maps',
      categorie: 'Tech',
      statut: 'Nouveau',
      dateAjout: '2024-01-12'
    }
  ]);

  const [categories] = useState([
    { nom: 'Tech', couleur: 'bg-primary', contacts: 1247 },
    { nom: 'Commerce', couleur: 'bg-success', contacts: 863 },
    { nom: 'Services', couleur: 'bg-warning', contacts: 542 },
    { nom: 'Autres', couleur: 'bg-muted', contacts: 195 }
  ]);

  const columns = [
    { key: 'nom', label: 'Nom', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'source', label: 'Source', sortable: true, filterable: true },
    { key: 'categorie', label: 'Catégorie', sortable: true, filterable: true },
    { key: 'statut', label: 'Statut', sortable: true, filterable: true },
    { key: 'dateAjout', label: 'Date d\'ajout', sortable: true }
  ];

  const filters = [
    {
      key: 'source',
      label: 'Source',
      options: ['Google Maps', 'Phantombuster', 'Manuel']
    },
    {
      key: 'categorie',
      label: 'Catégorie',
      options: ['Tech', 'Commerce', 'Services', 'Autres']
    },
    {
      key: 'statut',
      label: 'Statut',
      options: ['Nouveau', 'Contacté', 'Intéressé', 'Non intéressé']
    }
  ];

  const handleAddContact = () => {
    console.log('Ajouter un contact');
  };

  const handleEditContact = (contact: any) => {
    console.log('Modifier le contact:', contact);
  };

  const handleDeleteContact = (contact: any) => {
    console.log('Supprimer le contact:', contact);
  };

  const handleSyncSources = () => {
    console.log('Synchroniser toutes les sources');
  };

  return (
    <Layout title="Gestion des contacts">
      <div className="space-y-6">
        {/* SECTION: Actions principales */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleAddContact} variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
            <Plus className="h-4 w-4" />
            Ajouter un contact
          </Button>
          
          <Button variant="outline" className="gap-2 border-[#8675E1] border-2 text-[#8675E1]">
            <Upload className="h-4 w-4" />
            Importer CSV
          </Button>
          
          <Button variant="outline" className="gap-2 border border-[#8675E1] border-2 text-[#8675E1]">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleSyncSources} 
            className="gap-2 ml-auto border-[#8675E1] border-2 text-[#8675E1]"
          >
            <RefreshCw className="h-4 w-4" />
            Synchroniser toutes les sources
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SECTION: Gestion des catégories */}
          <Card>
            <CardHeader>
              <CardTitle>Catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((categorie, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${categorie.couleur}`} />
                      <span className="font-medium">{categorie.nom}</span>
                    </div>
                    <Badge variant="secondary">{categorie.contacts}</Badge>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" className="w-full mt-4 border-[#8675E1] border-2 text-[#8675E1]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle catégorie
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION: Table des contacts */}
          <div className="lg:col-span-3">
            <DataTable
              title="Liste des contacts"
              columns={columns}
              data={contacts}
              onAdd={handleAddContact}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
              filters={filters}
              searchPlaceholder="Rechercher par nom, email..."
            />
          </div>
        </div>

        {/* SECTION: Statistiques des sources */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques par Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-lg">Google Maps</h3>
                <p className="text-2xl font-bold text-primary mt-2">1,523</p>
                <p className="text-sm text-muted-foreground">contacts</p>
                <Badge className="mt-2 bg-success text-success-foreground">Actif</Badge>
              </div>
              
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-lg">Phantombuster</h3>
                <p className="text-2xl font-bold text-primary mt-2">894</p>
                <p className="text-sm text-muted-foreground">contacts</p>
                <Badge className="mt-2 bg-success text-success-foreground">Actif</Badge>
              </div>
              
              <div className="text-center p-4 border border-border rounded-lg">
                <h3 className="font-semibold text-lg">Ajout Manuel</h3>
                <p className="text-2xl font-bold text-primary mt-2">430</p>
                <p className="text-sm text-muted-foreground">contacts</p>
                <Badge className="mt-2 bg-success text-success-foreground">Actif</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Contacts;