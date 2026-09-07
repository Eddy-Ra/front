import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock3,
  Filter,
  CircleStop,
} from "lucide-react";

import { Layout } from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/api/api";

// ============================================================================
// TYPES
// ============================================================================

interface MailEnvoye {
  id: number;

  destinataire: string;
  sujet: string;
  contenu: string;

  categorie?: string;
  statut: string;

  threadId?: string;

  dateEnvoi: string;

  // Nombre de relances déjà effectuées
  relanceCount: number;

  // Dates des relances
  relance1At?: string;
  relance2At?: string;
}

type FiltreReponse =
  | "tous"
  | "repondu"
  | "non-repondu";

interface MailAvecStatutReponse
  extends MailEnvoye {
  repondu: boolean;

  joursSansReponse: number;

  heuresSansReponse: number;

  peutRelancer: boolean;

  relanceTerminee: boolean;

  prochaineRelanceMs: number;

  prochaineRelanceTexte: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Première relance après 72 heures
// Deuxième relance 72 heures après la première
const DELAI_RELANCE_HEURES = 72;

// Maximum 2 relances
const MAX_RELANCES = 2;

// Conversion
const HEURE_MS = 60 * 60 * 1000;
const JOUR_MS = 24 * HEURE_MS;

// Actualisation des données backend toutes les 30 secondes
const INTERVALLE_API = 30000;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Récupère le threadId peu importe le nom utilisé par le backend.
 */
const getThreadId = (item: any): string => {
  if (!item) {
    return "";
  }

  return String(
    item.threadId ??
      item.thread_id ??
      item.threadid ??
      item.gmail_thread_id ??
      item.gmailThreadId ??
      "",
  ).trim();
};

/**
 * Convertit une date en timestamp.
 */
const getDateValue = (value: unknown): number => {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return 0;
  }

  if (typeof value === "number") {
    if (value < 10000000000) {
      return value * 1000;
    }

    return value;
  }

  const normalized = value
    .trim()
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/([+-]\d{2})$/, "$1:00");

  const timestamp = Date.parse(normalized);

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
};

/**
 * Récupère la première valeur disponible.
 */
const getFirstValue = (
  item: any,
  fields: string[],
  defaultValue = "",
): string => {
  if (!item) {
    return defaultValue;
  }

  for (const field of fields) {
    const value = item[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }

  return defaultValue;
};

/**
 * Récupère un nombre.
 */
const getNumberValue = (
  item: any,
  fields: string[],
  defaultValue = 0,
): number => {
  if (!item) {
    return defaultValue;
  }

  for (const field of fields) {
    const value = item[field];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      const number = Number(value);

      if (!Number.isNaN(number)) {
        return number;
      }
    }
  }

  return defaultValue;
};

/**
 * Normalisation d'un mail.
 */
const normalizeMail = (
  item: any,
): MailEnvoye => {
  const idValue =
    item?.id ??
    item?.mail_id ??
    item?.mailId ??
    item?.id_mail ??
    0;

  const destinataire =
    getFirstValue(
      item,
      [
        "destinataire",
        "destination",
        "recipient",
        "recipient_email",
        "recipientEmail",
        "email",
        "email_destinataire",
        "emailDestination",
        "to",
        "mail",
      ],
      "",
    );

  const sujet =
    getFirstValue(
      item,
      [
        "sujet",
        "subject",
        "objet",
        "title",
      ],
      "",
    );

  const contenu =
    getFirstValue(
      item,
      [
        "contenu",
        "content",
        "body",
        "message",
        "corps",
        "texte",
      ],
      "",
    );

  const categorie =
    getFirstValue(
      item,
      [
        "categorie",
        "category",
        "type",
      ],
      "",
    );

  const statut =
    getFirstValue(
      item,
      [
        "statut",
        "status",
      ],
      "",
    );

  const dateEnvoi =
    getFirstValue(
      item,
      [
        "dateEnvoi",
        "date_envoi",
        "sent_at",
        "sentAt",
        "date_sent",
        "dateSent",
        "created_at",
        "createdAt",
      ],
      "",
    );

  // --------------------------------------------------------------------------
  // Nombre de relances
  // --------------------------------------------------------------------------

  let relanceCount =
    getNumberValue(
      item,
      [
        "relanceCount",
        "relance_count",
        "nombre_relances",
        "nombreRelances",
        "nb_relances",
        "nbRelances",
      ],
      0,
    );

  // Sécurité : maximum 2
  relanceCount = Math.max(
    0,
    Math.min(
      MAX_RELANCES,
      relanceCount,
    ),
  );

  // --------------------------------------------------------------------------
  // Dates des relances
  // --------------------------------------------------------------------------

  const relance1At =
    getFirstValue(
      item,
      [
        "relance1At",
        "relance1_at",
        "premiere_relance_at",
        "premiereRelanceAt",
      ],
      "",
    );

  const relance2At =
    getFirstValue(
      item,
      [
        "relance2At",
        "relance2_at",
        "deuxieme_relance_at",
        "deuxiemeRelanceAt",
      ],
      "",
    );

  // Si les dates existent mais que relance_count n'est pas rempli,
  // on peut déduire le nombre de relances.
  if (
    relanceCount === 0 &&
    relance2At
  ) {
    relanceCount = 2;
  } else if (
    relanceCount === 0 &&
    relance1At
  ) {
    relanceCount = 1;
  }

  return {
    ...item,

    id: Number(idValue),

    destinataire,

    sujet,

    contenu,

    categorie:
      categorie || undefined,

    statut,

    threadId:
      getThreadId(item) ||
      undefined,

    dateEnvoi,

    relanceCount,

    relance1At:
      relance1At || undefined,

    relance2At:
      relance2At || undefined,
  };
};

// ============================================================================
// PAGINATION
// ============================================================================

const fetchAllPages = async (
  endpoint: string,
): Promise<any[]> => {
  const limit = 50000;

  let offset = 0;

  let allData: any[] = [];

  while (true) {
    const res = await api.get(
      endpoint,
      {
        params: {
          limit,
          offset,
        },
      },
    );

    const raw = res.data;

    let batch: any[] = [];

    if (Array.isArray(raw)) {
      batch = raw;
    } else if (
      Array.isArray(raw?.data)
    ) {
      batch = raw.data;
    } else if (
      Array.isArray(raw?.results)
    ) {
      batch = raw.results;
    } else if (
      Array.isArray(raw?.items)
    ) {
      batch = raw.items;
    }

    allData = [
      ...allData,
      ...batch,
    ];

    if (batch.length < limit) {
      break;
    }

    offset += limit;
  }

  return allData;
};

// ============================================================================
// CALCUL DE LA PROCHAINE RELANCE
// ============================================================================

const getProchaineRelance = (
  mail: MailEnvoye,
): number => {
  const dateEnvoi =
    getDateValue(
      mail.dateEnvoi,
    );

  if (!dateEnvoi) {
    return 0;
  }

  // --------------------------------------------------------------------------
  // Aucune relance
  // --------------------------------------------------------------------------

  if (
    mail.relanceCount === 0
  ) {
    return (
      dateEnvoi +
      DELAI_RELANCE_HEURES *
        HEURE_MS
    );
  }

  // --------------------------------------------------------------------------
  // Une relance effectuée
  // --------------------------------------------------------------------------

  if (
    mail.relanceCount === 1
  ) {
    const dateRelance1 =
      getDateValue(
        mail.relance1At,
      );

    if (!dateRelance1) {
      return (
        dateEnvoi +
        2 *
          DELAI_RELANCE_HEURES *
          HEURE_MS
      );
    }

    return (
      dateRelance1 +
      DELAI_RELANCE_HEURES *
        HEURE_MS
    );
  }

  // --------------------------------------------------------------------------
  // Deux relances effectuées
  // --------------------------------------------------------------------------

  return 0;
};

// ============================================================================
// FORMATAGE HH:MM:SS
// ============================================================================

const formatTemps = (
  differenceMs: number,
): string => {
  if (differenceMs <= 0) {
    return "00:00:00";
  }

  const totalSecondes =
    Math.floor(
      differenceMs / 1000,
    );

  const heures =
    Math.floor(
      totalSecondes / 3600,
    );

  const minutes =
    Math.floor(
      (totalSecondes % 3600) /
        60,
    );

  const secondes =
    totalSecondes % 60;

  return `${String(
    heures,
  ).padStart(
    2,
    "0",
  )}:${String(
    minutes,
  ).padStart(
    2,
    "0",
  )}:${String(
    secondes,
  ).padStart(
    2,
    "0",
  )}`;
};

// ============================================================================
// COMPOSANT
// ============================================================================

const MailsEnvoyes = () => {
  // --------------------------------------------------------------------------
  // STATES
  // --------------------------------------------------------------------------

  const [
    mails,
    setMails,
  ] = useState<
    MailAvecStatutReponse[]
  >([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    filtre,
    setFiltre,
  ] = useState<FiltreReponse>(
    "tous",
  );

  // --------------------------------------------------------------------------
  // HORLOGE TEMPS RÉEL
  // --------------------------------------------------------------------------

  const [
    maintenant,
    setMaintenant,
  ] = useState(Date.now());

  // --------------------------------------------------------------------------
  // PROTECTION CONTRE LES DOUBLES RELANCES
  // --------------------------------------------------------------------------

  const relancesEnCours =
    useRef<Set<number>>(
      new Set(),
    );

  const relancesDejaDeclenchees =
    useRef<Set<number>>(
      new Set(),
    );

  // ==========================================================================
  // HORLOGE CHAQUE SECONDE
  // ==========================================================================

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setMaintenant(
          Date.now(),
        );
      }, 1000);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  // ==========================================================================
  // CHARGEMENT DES MAILS
  // ==========================================================================

  const fetchMailsEnvoyes =
    async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          envoisRaw,
          reponsesRaw,
        ] = await Promise.all([
          fetchAllPages(
            "/realtimestatus",
          ),

          fetchAllPages(
            "/b2b_mailsreponses",
          ),
        ]);

        console.log(
          "==============================",
        );

        console.log(
          "REALTIME STATUS :",
          envoisRaw,
        );

        console.log(
          "REPONSES :",
          reponsesRaw,
        );

        // --------------------------------------------------------------------
        // THREADS AYANT UNE REPONSE
        // --------------------------------------------------------------------

        const threadIdsRepondu =
          new Set(
            reponsesRaw
              .map(getThreadId)
              .filter(
                (
                  threadId,
                ): threadId is string =>
                  Boolean(threadId),
              ),
          );

        // --------------------------------------------------------------------
        // NORMALISATION
        // --------------------------------------------------------------------

        const mailsNormalises =
          envoisRaw.map(
            normalizeMail,
          );

        // --------------------------------------------------------------------
        // UNIQUEMENT MAILS ENVOYES
        // --------------------------------------------------------------------

        const mailsEnvoyes =
          mailsNormalises.filter(
            (mail) => {
              const statut =
                mail.statut
                  .toLowerCase()
                  .trim();

              return (
                statut === "envoyé" ||
                statut === "envoye" ||
                statut === "sent"
              );
            },
          );

        // --------------------------------------------------------------------
        // ENRICHISSEMENT
        // --------------------------------------------------------------------

        const enrichis =
          mailsEnvoyes.map(
            (mail) => {
              const threadId =
                getThreadId(mail);

              // Contact a répondu ?
              const repondu =
                Boolean(threadId) &&
                threadIdsRepondu.has(
                  threadId,
                );

              // ----------------------------------------------------------------
              // Temps sans réponse
              // ----------------------------------------------------------------

              const dateEnvoiMs =
                getDateValue(
                  mail.dateEnvoi,
                );

              let heuresSansReponse =
                0;

              if (
                dateEnvoiMs > 0
              ) {
                heuresSansReponse =
                  Math.floor(
                    Math.max(
                      0,
                      maintenant -
                        dateEnvoiMs,
                    ) / HEURE_MS,
                  );
              }

              const joursSansReponse =
                Math.floor(
                  heuresSansReponse /
                    24,
                );

              // ----------------------------------------------------------------
              // Prochaine relance
              // ----------------------------------------------------------------

              const prochaineRelanceMs =
                getProchaineRelance(
                  mail,
                );

              // ----------------------------------------------------------------
              // Relances terminées
              // ----------------------------------------------------------------

              const relanceTerminee =
                !repondu &&
                mail.relanceCount >=
                  MAX_RELANCES;

              // ----------------------------------------------------------------
              // Peut relancer ?
              // ----------------------------------------------------------------

              const peutRelancer =
                !repondu &&
                !relanceTerminee &&
                prochaineRelanceMs >
                  0 &&
                maintenant >=
                  prochaineRelanceMs;

              // ----------------------------------------------------------------
              // Texte du compteur
              // ----------------------------------------------------------------

              let prochaineRelanceTexte =
                "";

              if (repondu) {
                prochaineRelanceTexte =
                  "Répondu";
              } else if (
                relanceTerminee
              ) {
                prochaineRelanceTexte =
                  "Terminé";
              } else {
                const difference =
                  Math.max(
                    0,
                    prochaineRelanceMs -
                      maintenant,
                  );

                prochaineRelanceTexte =
                  formatTemps(
                    difference,
                  );
              }

              return {
                ...mail,

                threadId,

                repondu,

                heuresSansReponse,

                joursSansReponse,

                peutRelancer,

                relanceTerminee,

                prochaineRelanceMs,

                prochaineRelanceTexte,
              };
            },
          );

        setMails(enrichis);

        console.log(
          "MAILS ENRICHIS :",
          enrichis,
        );
      } catch (err) {
        console.error(
          "Erreur chargement mails :",
          err,
        );

        setError(
          "Erreur lors du chargement des mails envoyés.",
        );
      } finally {
        setIsLoading(false);
      }
    };

  // ==========================================================================
  // CHARGEMENT INITIAL + REFRESH 30 SEC
  // ==========================================================================

  useEffect(() => {
    fetchMailsEnvoyes();

    const interval =
      window.setInterval(
        fetchMailsEnvoyes,
        INTERVALLE_API,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  // ==========================================================================
  // RELANCE AUTOMATIQUE
  // ==========================================================================

  useEffect(() => {
    mails.forEach(
      (mail) => {
        // --------------------------------------------------------------
        // Si réponse reçue => STOP
        // --------------------------------------------------------------

        if (mail.repondu) {
          return;
        }

        // --------------------------------------------------------------
        // Deux relances déjà faites => STOP DEFINITIF
        // --------------------------------------------------------------

        if (
          mail.relanceCount >=
          MAX_RELANCES
        ) {
          return;
        }

        // --------------------------------------------------------------
        // Déjà en cours
        // --------------------------------------------------------------

        if (
          relancesEnCours.current.has(
            mail.id,
          )
        ) {
          return;
        }

        // --------------------------------------------------------------
        // Déjà déclenchée dans cette session
        // --------------------------------------------------------------

        if (
          relancesDejaDeclenchees.current.has(
            mail.id,
          )
        ) {
          return;
        }

        // --------------------------------------------------------------
        // Date de la prochaine relance
        // --------------------------------------------------------------

        const prochaineRelance =
          getProchaineRelance(
            mail,
          );

        if (
          !prochaineRelance
        ) {
          return;
        }

        // --------------------------------------------------------------
        // 72 heures atteintes
        // --------------------------------------------------------------

        if (
          maintenant >=
          prochaineRelance
        ) {
          handleRelanceAutomatique(
            mail,
          );
        }
      },
    );
  }, [
    maintenant,
    mails,
  ]);

  // ==========================================================================
  // DECLENCHEMENT DE LA RELANCE
  // ==========================================================================

  const handleRelanceAutomatique =
    async (
      mail: MailAvecStatutReponse,
    ) => {
      // Sécurité
      if (mail.repondu) {
        return;
      }

      if (
        mail.relanceCount >=
        MAX_RELANCES
      ) {
        return;
      }

      if (
        relancesEnCours.current.has(
          mail.id,
        )
      ) {
        return;
      }

      if (
        relancesDejaDeclenchees.current.has(
          mail.id,
        )
      ) {
        return;
      }

      relancesEnCours.current.add(
        mail.id,
      );

      try {
        console.log(
          "================================",
        );

        console.log(
          "⏰ RELANCE AUTOMATIQUE",
        );

        console.log(
          "Destinataire :",
          mail.destinataire,
        );

        console.log(
          "Relance actuelle :",
          mail.relanceCount + 1,
        );

        // --------------------------------------------------------------------
        // Numéro de la relance
        // --------------------------------------------------------------------

        const numeroRelance =
          mail.relanceCount + 1;

        // --------------------------------------------------------------------
        // WEBHOOK N8N
        // --------------------------------------------------------------------

        const webhookUrl =
          "https://n8n.projets-omega.net/webhook-test/53b181f1-7b25-4835-8509-relancemailsgen";

        await api.post(
          webhookUrl,
          {
            mode:
              "generate_emails",

            automatique:
              true,

            numeroRelance,

            timestamp:
              new Date().toISOString(),

            contacts: [
              {
                email:
                  mail.destinataire,

                sujet:
                  mail.sujet,

                dateEnvoi:
                  mail.dateEnvoi,

                joursSansReponse:
                  mail.joursSansReponse,

                heuresSansReponse:
                  mail.heuresSansReponse,

                threadId:
                  mail.threadId,

                numeroRelance,

                relanceAutomatique:
                  true,
              },
            ],
          },
        );

        // --------------------------------------------------------------------
        // MARQUER COMME DECLENCHEE
        // --------------------------------------------------------------------

        relancesDejaDeclenchees.current.add(
          mail.id,
        );

        // --------------------------------------------------------------------
        // Actualisation immédiate locale
        // --------------------------------------------------------------------

        setMails((prev) =>
          prev.map(
            (item) => {
              if (
                item.id !==
                mail.id
              ) {
                return item;
              }

              const nouveauNombre =
                Math.min(
                  MAX_RELANCES,
                  item.relanceCount +
                    1,
                );

              let nouvelleDate1 =
                item.relance1At;

              let nouvelleDate2 =
                item.relance2At;

              const maintenantISO =
                new Date().toISOString();

              if (
                nouveauNombre ===
                1
              ) {
                nouvelleDate1 =
                  maintenantISO;
              }

              if (
                nouveauNombre ===
                2
              ) {
                nouvelleDate2 =
                  maintenantISO;
              }

              const nouveauMail =
                {
                  ...item,

                  relanceCount:
                    nouveauNombre,

                  relance1At:
                    nouvelleDate1,

                  relance2At:
                    nouvelleDate2,
                };

              const prochaine =
                getProchaineRelance(
                  nouveauMail,
                );

              return {
                ...nouveauMail,

                prochaineRelanceMs:
                  prochaine,

                relanceTerminee:
                  nouveauNombre >=
                  MAX_RELANCES,

                peutRelancer:
                  false,

                prochaineRelanceTexte:
                  nouveauNombre >=
                  MAX_RELANCES
                    ? "Terminé"
                    : formatTemps(
                        Math.max(
                          0,
                          prochaine -
                            Date.now(),
                        ),
                      ),
              };
            },
          ),
        );

        console.log(
          "✅ Relance",
          numeroRelance,
          "déclenchée",
        );

        // --------------------------------------------------------------------
        // Actualiser depuis le backend
        // --------------------------------------------------------------------

        await fetchMailsEnvoyes();
      } catch (err) {
        console.error(
          "❌ Erreur relance automatique :",
          err,
        );

        setError(
          `La relance n°${
            mail.relanceCount + 1
          } n'a pas pu être envoyée.`,
        );

        // Permettre une nouvelle tentative
        relancesDejaDeclenchees.current.delete(
          mail.id,
        );
      } finally {
        relancesEnCours.current.delete(
          mail.id,
        );
      }
    };

  // ==========================================================================
  // FILTRAGE
  // ==========================================================================

  const mailsFiltres =
    useMemo(() => {
      let resultat =
        [...mails];

      if (
        filtre ===
        "repondu"
      ) {
        resultat =
          resultat.filter(
            (mail) =>
              mail.repondu,
          );
      }

      if (
        filtre ===
        "non-repondu"
      ) {
        resultat =
          resultat.filter(
            (mail) =>
              !mail.repondu,
          );
      }

      // ----------------------------------------------------------------------
      // TRI PAR TEMPS RESTANT
      //
      // Celui qui doit être relancé le plus rapidement est en haut.
      // Les mails terminés/répondus vont en bas.
      // ----------------------------------------------------------------------

      resultat.sort(
        (a, b) => {
          // Non répondu avant répondu
          if (
            a.repondu !==
            b.repondu
          ) {
            return a.repondu
              ? 1
              : -1;
          }

          // Les mails non terminés avant les terminés
          if (
            a.relanceTerminee !==
            b.relanceTerminee
          ) {
            return a.relanceTerminee
              ? 1
              : -1;
          }

          // Pour les mails actifs :
          // temps restant le plus petit en premier
          if (
            !a.repondu &&
            !a.relanceTerminee
          ) {
            return (
              a.prochaineRelanceMs -
              b.prochaineRelanceMs
            );
          }

          // Pour les autres :
          // plus ancien en premier
          return (
            getDateValue(
              a.dateEnvoi,
            ) -
            getDateValue(
              b.dateEnvoi,
            )
          );
        },
      );

      return resultat;
    }, [
      mails,
      filtre,
      maintenant,
    ]);

  // ==========================================================================
  // COMPTEURS
  // ==========================================================================

  const compteurs =
    useMemo(
      () => ({
        tous:
          mails.length,

        repondu:
          mails.filter(
            (mail) =>
              mail.repondu,
          ).length,

        nonRepondu:
          mails.filter(
            (mail) =>
              !mail.repondu,
          ).length,

        termines:
          mails.filter(
            (mail) =>
              !mail.repondu &&
              mail.relanceTerminee,
          ).length,
      }),
      [mails],
    );

  // ==========================================================================
  // RENDU
  // ==========================================================================

  return (
    <Layout title="Mails envoyés">

      <div className="space-y-6">

        {/* ================================================================ */}
        {/* ERREUR */}
        {/* ================================================================ */}

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* FILTRES */}
        {/* ================================================================ */}

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">

          <div className="flex items-center gap-2">

            <Filter className="h-4 w-4 text-muted-foreground" />

            <Button
              size="sm"
              variant={
                filtre === "tous"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setFiltre("tous")
              }
            >
              Tous (
              {compteurs.tous}
              )
            </Button>

            <Button
              size="sm"
              variant={
                filtre ===
                "repondu"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setFiltre(
                  "repondu",
                )
              }
              className="gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />

              Répondu (
              {compteurs.repondu}
              )
            </Button>

            <Button
              size="sm"
              variant={
                filtre ===
                "non-repondu"
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                setFiltre(
                  "non-repondu",
                )
              }
              className="gap-1"
            >
              <Clock3 className="h-3 w-3" />

              Non répondu (
              {
                compteurs.nonRepondu
              }
              )
            </Button>

          </div>

          {/* ============================================================ */}
          {/* ACTUALISER */}
          {/* ============================================================ */}

          <Button
            variant="outline"
            className="sm:ml-auto gap-2"
            onClick={
              fetchMailsEnvoyes
            }
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}

            Actualiser
          </Button>

        </div>

        {/* ================================================================ */}
        {/* LISTE */}
        {/* ================================================================ */}

        <Card>

          <CardHeader>

            <CardTitle>
              Mails envoyés
            </CardTitle>

          </CardHeader>

          <CardContent>

            {isLoading ? (

              <div className="flex items-center justify-center h-40">

                <Loader2 className="h-6 w-6 animate-spin text-primary" />

              </div>

            ) : (

              <div className="space-y-4">

                {mailsFiltres.map(
                  (mail) => {

                    // ------------------------------------------------------
                    // Calcul du compteur en temps réel
                    // ------------------------------------------------------

                    const prochaineRelance =
                      getProchaineRelance(
                        mail,
                      );

                    const tempsRestant =
                      Math.max(
                        0,
                        prochaineRelance -
                          maintenant,
                      );

                    const compteur =
                      formatTemps(
                        tempsRestant,
                      );

                    return (

                      <div
                        key={mail.id}
                        className="p-4 border rounded-lg"
                      >

                        {/* ================================================= */}
                        {/* EN-TETE */}
                        {/* ================================================= */}

                        <div className="flex items-start justify-between mb-3">

                          <div className="flex-1">

                            <div className="flex items-center gap-2 mb-1">

                              <h4 className="font-medium">

                                {mail.sujet ||
                                  "(Sans sujet)"}

                              </h4>

                              {/* REPONDU */}

                              {mail.repondu ? (

                                <Badge className="gap-1">

                                  <CheckCircle2 className="h-3 w-3" />

                                  Répondu

                                </Badge>

                              ) : mail.relanceTerminee ? (

                                <Badge
                                  variant="outline"
                                  className="gap-1"
                                >

                                  <CircleStop className="h-3 w-3" />

                                  Terminé · 2 relances

                                </Badge>

                              ) : (

                                <Badge
                                  variant="secondary"
                                  className="gap-1"
                                >

                                  <Clock3 className="h-3 w-3" />

                                  Non répondu

                                </Badge>

                              )}

                            </div>

                            {/* DESTINATAIRE */}

                            <p className="text-sm text-muted-foreground">

                              {mail.destinataire ||
                                "(Destinataire inconnu)"}

                            </p>

                            {/* CONTENU */}

                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">

                              {mail.contenu ||
                                "(Contenu vide)"}

                            </p>

                          </div>

                        </div>

                        {/* ================================================= */}
                        {/* INFORMATIONS */}
                        {/* ================================================= */}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">

                          {mail.categorie && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {
                                mail.categorie
                              }
                            </Badge>
                          )}

                          <span>
                            Envoyé le{" "}
                            {getDateValue(
                              mail.dateEnvoi,
                            ) > 0
                              ? new Date(
                                  getDateValue(
                                    mail.dateEnvoi,
                                  ),
                                ).toLocaleDateString(
                                  "fr-FR",
                                )
                              : "Date inconnue"}
                          </span>

                        </div>

                        {/* ================================================= */}
                        {/* COMPTEUR EN BAS */}
                        {/* ================================================= */}

                        <div className="mt-4 pt-3 border-t flex items-center justify-between">

                          {/* GAUCHE */}
                          <div className="text-xs text-muted-foreground">

                            {!mail.repondu &&
                              !mail.relanceTerminee && (
                                <>
                                  Relances :{" "}
                                  <strong>
                                    {
                                      mail.relanceCount
                                    }
                                    /2
                                  </strong>
                                </>
                              )}

                            {mail.relanceTerminee && (
                              <>
                                Relances effectuées :{" "}
                                <strong>
                                  2/2
                                </strong>
                              </>
                            )}

                            {mail.repondu && (
                              <>
                                Aucune autre relance
                              </>
                            )}

                          </div>

                          {/* DROITE */}
                          <div className="flex flex-col items-end">

                            {mail.repondu ? (

                              <div className="flex items-center gap-2">

                                <CheckCircle2 className="h-4 w-4" />

                                <span className="text-sm font-medium">

                                  Réponse reçue

                                </span>

                              </div>

                            ) : mail.relanceTerminee ? (

                              <div className="flex items-center gap-2 text-muted-foreground">

                                <CircleStop className="h-4 w-4" />

                                <span className="text-sm font-medium">

                                  Relance terminée

                                </span>

                              </div>

                            ) : (

                              <>

                                <span className="text-xs text-muted-foreground">

                                  Prochaine relance n°
                                  {" "}
                                  {
                                    mail.relanceCount +
                                    1
                                  }
                                  {" "}
                                  dans

                                </span>

                                <span className="font-mono text-xl font-bold tracking-wider">

                                  {compteur}

                                </span>

                              </>

                            )}

                          </div>

                        </div>

                      </div>

                    );
                  },
                )}

                {/* ========================================================= */}
                {/* AUCUN RESULTAT */}
                {/* ========================================================= */}

                {mailsFiltres.length ===
                  0 && (

                  <p className="text-center text-sm text-muted-foreground py-8">

                    Aucun mail dans cette catégorie.

                  </p>

                )}

              </div>

            )}

          </CardContent>

        </Card>

      </div>

    </Layout>
  );
};

export default MailsEnvoyes;