import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/api/api";

export interface Notification {
  id: number;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const STORAGE_KEY = "notif_counts";

const loadCounts = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { attente: -1, reponses: -1, contacts: -1 };
  } catch {
    return { attente: -1, reponses: -1, contacts: -1 };
  }
};

const saveCounts = (counts: { attente: number; reponses: number; contacts: number }) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
};

const extractArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.records)) return data.records;
  return [];
};

const fetchAllPages = async (endpoint: string): Promise<any[]> => {
  const limit = 1000;
  let offset = 0;
  let allData: any[] = [];
  while (true) {
    const res = await api.get(endpoint, { params: { limit, offset } });
    const batch = extractArray(res.data);
    allData = [...allData, ...batch];
    if (batch.length < limit) break;
    offset += limit;
  }
  return allData;
};

interface NotificationsContextValue {
  notifications: Notification[];
  markAllRead: () => void;
  markRead: (id: number) => void;
  deleteNotif: (id: number) => void;
  deleteAll: () => void;
  checkSystemAlerts: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const lastCounts = useRef(loadCounts());
  const lastSnapshot = useRef({
    attente: [] as any[],
    reponses: [] as any[],
    contacts: [] as any[],
  });
  const inFlight = useRef(false);
  const notifIdRef = useRef(Date.now());

  const getSignature = (items: any[]) =>
    items
      .map((item) => `${item?.id ?? item?.email ?? item?.contact_id ?? item?.created_at ?? item?.updated_at ?? item?.timestamp ?? ""}`)
      .join("|");

  const checkSystemAlerts = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      const [attenteRes, repRes, contactsRes] = await Promise.allSettled([
        fetchAllPages("/realtimestatus"),
        fetchAllPages("/b2b_mailsreponses"),
        fetchAllPages("/b2b_datasynch"),
      ]);

      const attenteAll = attenteRes.status === "fulfilled" ? attenteRes.value : [];
      const attenteItems = attenteAll.filter((item: any) => item.statut === "En cours");
      const attenteCount = attenteItems.length;
      const reponsesAll = repRes.status === "fulfilled" ? repRes.value : [];
      const reponsesCount = reponsesAll.length;
      const contactsAll = contactsRes.status === "fulfilled" ? contactsRes.value : [];
      const contactsCount = contactsAll.length;

      const signatureAttente = getSignature(attenteItems);
      const signatureReponses = getSignature(reponsesAll);
      const signatureContacts = getSignature(contactsAll);

      const time = new Date().toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      });

      const newNotifs: Notification[] = [];
      const lc = lastCounts.current;
      const previousAttente = lastSnapshot.current.attente;
      const previousReponses = lastSnapshot.current.reponses;
      const previousContacts = lastSnapshot.current.contacts;

      const hasNewAttente =
        lc.attente === -1
          ? attenteCount > 0
          : attenteCount > lc.attente || signatureAttente !== getSignature(previousAttente);

      const hasNewReponses =
        lc.reponses === -1
          ? reponsesCount > 0
          : reponsesCount > lc.reponses || signatureReponses !== getSignature(previousReponses);

      const hasNewContacts =
        contactsCount !== lc.contacts || signatureContacts !== getSignature(previousContacts);

      if (hasNewAttente) {
        newNotifs.push({
          id: notifIdRef.current++, read: false, time,
          type: "warning",
          title: "Nouveau mail en attente",
          message: `${attenteCount} mail(s) en cours de traitement.`,
        });
      }

      if (hasNewReponses) {
        newNotifs.push({
          id: notifIdRef.current++, read: false, time,
          type: "success",
          title: "Nouvelle donnée détectée",
          message: `${reponsesCount} réponse(s) à consulter.`,
        });
      }

      if (contactsCount === 0 && lc.contacts > 0) {
        newNotifs.push({
          id: notifIdRef.current++, read: false, time,
          type: "error",
          title: "Base de contacts vide",
          message: "Aucun contact trouvé dans la base de données.",
        });
      }

      if (lc.attente === -1 && contactsCount > 0) {
        newNotifs.push({
          id: notifIdRef.current++, read: false, time,
          type: "info",
          title: "Système opérationnel",
          message: "Toutes les sources de données sont synchronisées.",
        });
      }

      if (hasNewContacts && contactsCount > 0 && lc.contacts !== -1) {
        newNotifs.push({
          id: notifIdRef.current++, read: false, time,
          type: "info",
          title: "Mise à jour des contacts",
          message: `${contactsCount} contact(s) actuellement présent(s).`,
        });
      }

      lastCounts.current = { attente: attenteCount, reponses: reponsesCount, contacts: contactsCount };
      lastSnapshot.current = {
        attente: attenteItems,
        reponses: reponsesAll,
        contacts: contactsAll,
      };
      saveCounts(lastCounts.current);

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...newNotifs, ...prev]);
      }
    } catch (err) {
      console.error("❌ Erreur checkSystemAlerts:", err);
      setNotifications((prev) => [
        {
          id: notifIdRef.current++, read: false, type: "error",
          title: "Erreur de connexion",
          message: "Impossible de contacter le serveur.",
          time: new Date().toLocaleString("fr-FR"),
        },
        ...prev,
      ]);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void checkSystemAlerts();
    const interval = setInterval(() => {
      void checkSystemAlerts();
    }, 3 * 1000);
    return () => clearInterval(interval);
  }, [checkSystemAlerts]);

  useEffect(() => {
    void checkSystemAlerts();
    const interval = setInterval(() => {
      void checkSystemAlerts();
    }, 3 * 1000);
    return () => clearInterval(interval);
  }, [checkSystemAlerts]);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const deleteNotif = (id: number) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const deleteAll = () => {
    setNotifications([]);
    lastCounts.current = { attente: -1, reponses: -1, contacts: -1 };
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, markAllRead, markRead, deleteNotif, deleteAll, checkSystemAlerts }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationsProvider");
  return ctx;
};