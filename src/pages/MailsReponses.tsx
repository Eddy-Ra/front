import React, { useState, useMemo, useEffect } from 'react';
import { Mail, ThumbsUp, ThumbsDown, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 2;

interface Reponse {
  id: number;
  expediteur: string;
  sujet: string;
  contenu: string;
  mailOriginal: string;
  statut: string;
  dateReponse: string;
  entreprise: string;
  categorie: string;
}

// ✅ Normalisation centralisée des statuts (évite les doublons partout)
const normalizeStatut = (statut: string): string => {
  if (!statut) return 'Non intéressé';
  const s = statut.trim().toLowerCase();
  if (s === 'intéressé' || s === 'interessee' || s === 'intéressés') return 'Intéressé';
  if (s === 'non intéressé' || s === 'non intéressés') return 'Non intéressé';
  if (s === 'intéressé plus tard' || s === 'plus tard') return 'Intéressé plus tard';
  if (s === 'aucun rapport') return 'Aucun rapport';
  return statut;
};

const MailsReponses = () => {
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReponse, setSelectedReponse] = useState<Reponse | null>(null);
  const [activeTab, setActiveTab] = useState('toutes');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReponses = async () => {
    try {
      const res = await api.get("/b2b_mailsreponses");

      const mappedData: Reponse[] = res.data
        .filter((item: any) => item.expediteur !== null)
        .filter((item: any) => normalizeStatut(item.statut) !== 'Aucun rapport')
        .map((item: any) => ({
          id: item.id,
          expediteur: item.expediteur ?? 'Inconnu',
          sujet: item.sujet ?? 'Sans sujet',
          contenu: item.contenu ?? '',
          mailOriginal: item.mailOriginal ?? '',
          // ✅ Normalisation appliquée dès le fetch
          statut: normalizeStatut(item.statut),
          dateReponse: item.dateReponse
            ? new Date(item.dateReponse).toLocaleDateString()
            : 'Date inconnue',
          entreprise: item.entreprise ?? 'Inconnue',
          categorie: item.categorie ?? 'Autre',
        }));

      setReponses(mappedData);
    } catch (err) {
      console.error("Erreur chargement réponses:", err);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les réponses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReponses();
  }, []);

  // ✅ Filtrage simplifié grâce à la normalisation
  const filteredReponses = useMemo(() => {
    return reponses.filter(r => {
      if (activeTab === 'toutes') return true;
      if (activeTab === 'interesse') return r.statut === 'Intéressé';
      if (activeTab === 'non-interesse') return r.statut === 'Non intéressé';
      if (activeTab === 'plus-tard') return r.statut === 'Intéressé plus tard';
      return true;
    });
  }, [activeTab, reponses]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredReponses.length / ITEMS_PER_PAGE)),
    [filteredReponses]
  );

  const paginatedReponses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReponses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReponses, currentPage]);

  // ✅ Reset page + sélection au changement d'onglet
  useEffect(() => {
    setCurrentPage(1);
    setSelectedReponse(null);
  }, [activeTab]);

  // ✅ Stats simplifiées grâce à normalizeStatut
  const stats = useMemo(() => ({
    total: reponses.length,
    interesse: reponses.filter(r => r.statut === 'Intéressé').length,
    nonInteresse: reponses.filter(r => r.statut === 'Non intéressé').length,
    plusTard: reponses.filter(r => r.statut === 'Intéressé plus tard').length,
  }), [reponses]);

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'Intéressé': return <ThumbsUp className="h-4 w-4 text-success" />;
      case 'Non intéressé': return <ThumbsDown className="h-4 w-4 text-destructive" />;
      case 'Intéressé plus tard': return <Clock className="h-4 w-4 text-warning" />;
      default: return <Mail className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Intéressé': return <Badge className="bg-success text-success-foreground">Intéressé</Badge>;
      case 'Non intéressé': return <Badge variant="destructive">Non intéressé</Badge>;
      case 'Intéressé plus tard': return <Badge className="bg-warning text-warning-foreground">Plus tard</Badge>;
      default: return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const handleChangeStatus = async (reponse: Reponse, newStatus: string) => {
    // ✅ Mapping UI -> API corrigé et complet
    const apiStatusMap: Record<string, string> = {
      'Intéressé': 'Intéressé',
      'Intéressé plus tard': 'Intéressé plus tard',
      'Non intéressé': 'Non intéressé',
    };

    const apiStatus = apiStatusMap[newStatus];
    if (!apiStatus) return;

    const previousReponses = [...reponses];

    // Optimistic update
    setReponses(prev =>
      prev.map(r => r.id === reponse.id ? { ...r, statut: newStatus } : r)
    );
    if (selectedReponse?.id === reponse.id) {
      setSelectedReponse(prev => prev ? { ...prev, statut: newStatus } : prev);
    }

    try {
      await api.patch(`/b2b_response_mail/${reponse.id}`, { statut: apiStatus });

      toast({
        title: "Statut mis à jour",
        description: `Statut changé en "${newStatus}"`,
      });
    } catch (error: any) {
      // Rollback
      setReponses(previousReponses);
      if (selectedReponse?.id === reponse.id) {
        setSelectedReponse(prev => prev ? { ...prev, statut: reponse.statut } : prev);
      }

      const errorMessage = error.response?.data?.message || error.message || "Erreur inconnue";
      toast({
        title: "Erreur lors de la mise à jour",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout title="Gestion des réponses aux mails">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des réponses...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestion des réponses aux mails">
      <div className="space-y-6">

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total réponses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-success" />
              <p className="text-2xl font-bold text-success">{stats.interesse}</p>
              <p className="text-sm text-muted-foreground">Intéressés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-warning">{stats.plusTard}</p>
              <p className="text-sm text-muted-foreground">Plus tard</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsDown className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{stats.nonInteresse}</p>
              <p className="text-sm text-muted-foreground">Non intéressés</p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="toutes">Toutes ({stats.total})</TabsTrigger>
            <TabsTrigger value="interesse">Intéressés ({stats.interesse})</TabsTrigger>
            <TabsTrigger value="plus-tard">Plus tard ({stats.plusTard})</TabsTrigger>
            <TabsTrigger value="non-interesse">Non intéressés ({stats.nonInteresse})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Liste */}
              <div className="space-y-4">
                {paginatedReponses.map((reponse) => (
                  <Card
                    key={reponse.id}
                    className={`cursor-pointer transition-colors hover:bg-secondary/50 ${selectedReponse?.id === reponse.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedReponse(reponse)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(reponse.statut)}
                            <h4 className="font-medium">{reponse.expediteur}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{reponse.entreprise}</p>
                        </div>
                        {getStatusBadge(reponse.statut)}
                      </div>
                      <h5 className="font-medium mb-2">{reponse.sujet}</h5>
                      <p className="text-sm text-muted-foreground line-clamp-2">{reponse.contenu}</p>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{reponse.categorie}</Badge>
                        <span>{reponse.dateReponse}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredReponses.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucune réponse dans cette catégorie</p>
                    </CardContent>
                  </Card>
                )}

                {/* Pagination */}
                {filteredReponses.length > 0 && (
                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Détail sélectionné */}
              <div className="space-y-4">
                {selectedReponse ? (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Détail de la réponse</CardTitle>
                          {getStatusBadge(selectedReponse.statut)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Informations</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Expéditeur :</span> {selectedReponse.expediteur}</p>
                            <p><span className="font-medium">Entreprise :</span> {selectedReponse.entreprise}</p>
                            <p><span className="font-medium">Catégorie :</span> {selectedReponse.categorie}</p>
                            <p><span className="font-medium">Date :</span> {selectedReponse.dateReponse}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Sujet</h4>
                          <p className="text-sm bg-muted p-3 rounded-md">{selectedReponse.sujet}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Contenu de la réponse</h4>
                          <p className="text-sm bg-card border border-border p-3 rounded-md whitespace-pre-wrap">
                            {selectedReponse.contenu}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Mail original envoyé</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md text-muted-foreground whitespace-pre-wrap">
                            {selectedReponse.mailOriginal || 'Non disponible'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Actions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <h5 className="font-medium">Changer le statut :</h5>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={selectedReponse.statut === 'Intéressé' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Intéressé')}
                              className="gap-2"
                            >
                              <ThumbsUp className="h-3 w-3" /> Intéressé
                            </Button>
                            <Button
                              variant={selectedReponse.statut === 'Intéressé plus tard' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Intéressé plus tard')}
                              className="gap-2"
                            >
                              <Clock className="h-3 w-3" /> Plus tard
                            </Button>
                            <Button
                              variant={selectedReponse.statut === 'Non intéressé' ? 'destructive' : 'outline'}
                              size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Non intéressé')}
                              className="gap-2"
                            >
                              <ThumbsDown className="h-3 w-3" /> Non intéressé
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Sélectionnez une réponse pour voir les détails</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MailsReponses;
