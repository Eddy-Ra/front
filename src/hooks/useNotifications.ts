import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/api/api';

export interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

let notifId = Date.now();
const persistedCounts = { attente: -1, reponses: -1, contacts: -1 };

const extractArray = (data: any): any[] => {
  if (Array.isArray(data))          return data;
  if (Array.isArray(data?.data))    return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items))   return data.items;
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

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const initialized = useRef(false);
  const lastCounts = useRef(persistedCounts);

  const checkSystemAlerts = useCallback(async () => {
    try {
      const [attenteRes, repRes, contactsRes] = await Promise.allSettled([
        fetchAllPages('/realtimestatus'),
        fetchAllPages('/b2b_mailsreponses'),
        fetchAllPages('/b2b_datasynch'),
      ]);

      const attenteCount = attenteRes.status === 'fulfilled'
        ? attenteRes.value.filter((item: any) => item.statut === 'En cours').length
        : 0;

      // 👇 DEBUG
      const attenteAll = attenteRes.status === 'fulfilled' ? attenteRes.value : [];
      console.log('🔍 Statuts trouvés:', [...new Set(attenteAll.map((i: any) => i.statut))]);
      console.log('🔍 Premier item:', JSON.stringify(attenteAll[0]).slice(0, 200));
      // 👆 FIN DEBUG

      const reponsesCount = repRes.status === 'fulfilled'
        ? repRes.value.length
        : 0;

      const contactsCount = contactsRes.status === 'fulfilled'
        ? contactsRes.value.length
        : 0;

      console.log('📊 Counts:', { attenteCount, reponsesCount, contactsCount });
      console.log('📊 lastCounts:', { ...lastCounts.current });

      const time = new Date().toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });

      const newNotifs: Notification[] = [];
      const lc = lastCounts.current;

      if (lc.attente === -1 && attenteCount > 0) {
        newNotifs.push({
          id: notifId++, read: false, time,
          type: 'warning',
          title: 'Mails en attente',
          message: `${attenteCount} mail(s) en cours de traitement.`
        });
      } else if (lc.attente !== -1 && attenteCount > lc.attente) {
        newNotifs.push({
          id: notifId++, read: false, time,
          type: 'warning',
          title: 'Nouveaux mails en attente',
          message: `+${attenteCount - lc.attente} mail(s) en cours de traitement.`
        });
      }

      if (lc.reponses === -1 && reponsesCount > 0) {
        newNotifs.push({
          id: notifId++, read: false, time,
          type: 'success',
          title: 'Réponses reçues',
          message: `${reponsesCount} réponse(s) à consulter.`
        });
      } else if (lc.reponses !== -1 && reponsesCount > lc.reponses) {
        newNotifs.push({
          id: notifId++, read: false, time,
          type: 'success',
          title: 'Nouvelles réponses reçues',
          message: `+${reponsesCount - lc.reponses} nouvelle(s) réponse(s) reçue(s).`
        });
      }

      if (contactsCount === 0 && contactsRes.status === 'fulfilled') {
        newNotifs.push({
          id: notifId++, read: false, time,
          type: 'error',
          title: 'Base de contacts vide',
          message: 'Aucun contact trouvé dans la base de données.'
        });
      }

      if (lc.attente === -1 && contactsCount > 0) {
        newNotifs.push({
          id: notifId++, read: false, time,
          type: 'info',
          title: 'Système opérationnel',
          message: 'Toutes les sources de données sont synchronisées.'
        });
      }

      console.log('🔔 Nouvelles notifs:', newNotifs.length, newNotifs.map(n => n.title));

      lc.attente   = attenteCount;
      lc.reponses  = reponsesCount;
      lc.contacts  = contactsCount;

      if (newNotifs.length > 0) {
        setNotifications(prev => [...newNotifs, ...prev]);
      }

    } catch (err) {
      console.error('❌ Erreur checkSystemAlerts:', err);
      setNotifications(prev => [{
        id: notifId++,
        read: false,
        type: 'error',
        title: 'Erreur de connexion',
        message: 'Impossible de contacter le serveur.',
        time: new Date().toLocaleString('fr-FR')
      }, ...prev]);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    checkSystemAlerts();
    const interval = setInterval(checkSystemAlerts, 60 * 1000);
    return () => clearInterval(interval);
  }, [checkSystemAlerts]);

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const markRead = (id: number) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const deleteNotif = (id: number) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const deleteAll = () => setNotifications([]);

  return { notifications, markAllRead, markRead, deleteNotif, deleteAll, checkSystemAlerts };
};