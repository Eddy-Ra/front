import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Mail, ThumbsUp, ThumbsDown, Clock,
  ChevronLeft, ChevronRight, Send, X, Copy, Sparkles, Loader2,
  CheckCircle2, CircleDashed, MessageSquare, User, Bot, Building2,
  ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import { Layout } from '@/components/ui/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api/api';
import { toast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 2;

interface Reponse {
  reponse: boolean | string;
  reponse_par_IA?: string;
  categorie_env: string;
  threadId: string;
  id: number;
  expediteur: string;
  sujet: string;
  contenu: string;
  mailOriginal: string;
  statut: string;
  dateReponse: string;
  entreprise: string;
  categorie: string;

  dateReponseRaw: string; // ← AJOUTER
}

interface MailEnvoi {
  id: number;
  email: string;
  statut: string;
  category: string;
  company: string;
  mailID: string;
  mailid: string;
  created_at: string;
}

interface Relance {
  id: number;
  email: string;
  sujet: string;
  contenu: string;
  statut: string;
  date_reception: string;
  date_reponse: string;
  entreprise: string;
  categorie: string;
  reponse_ia: string;
  categorie_env: string;
}

interface ThreadMessage {
  id: string;
  type: 'received' | 'sent' | 'ai_draft' | 'relance';
  from: string;
  to?: string;
  content: string;
  date: string;
  label: string;
  sortKey: string;
}

const isRepondu = (r: boolean | string | undefined | null): boolean =>
  r === true || r === 'true' || r === 'TRUE' || r === '1' || (r as any) === 1;

const normalizeStatut = (statut: string): string => {
  if (!statut) return 'Non intéressé';
  const s = statut.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s === 'interesse' || s === 'interessee' || s === 'interesses') return 'Intéressé';
  if (s === 'non interesse' || s === 'non interesses') return 'Non intéressé';
  if (s === 'interesse plus tard' || s === 'plus tard') return 'Intéressé plus tard';
  if (s === 'aucun rapport') return 'Aucun rapport';
  return statut;
};

const toTimestamp = (dateStr: string): number => {
  if (!dateStr) return 0;

  // Format PostgreSQL: "2026-05-04 08:03:28.653322+00" ou "2026-05-04T08:03:28.653322+00"
  // Normaliser l'espace en T pour que Date.parse() fonctionne
  const normalized = dateStr.trim().replace(' ', 'T');
  const ts = Date.parse(normalized);
  if (!isNaN(ts)) return ts;

  // Fallback DD/MM/YYYY
  const frMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})([ T](\d{2}):(\d{2})(:(\d{2}))?)?/);
  if (frMatch) {
    const [, d, m, y, , hh = '00', mm = '00', , ss = '00'] = frMatch;
    const ts2 = Date.parse(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
    return isNaN(ts2) ? 0 : ts2;
  }

  return 0;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'Date inconnue';
  const ts = toTimestamp(dateStr);
  if (!ts) return dateStr;
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', // ← AJOUTER pour voir l'heure
  });
};

// ─── Décodage base64url (format Gmail API) ───────────────────────────────────
const decodeBase64url = (str: string): string => {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return decodeURIComponent(
      decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  } catch {
    return '';
  }
};

// ─── Extrait le contenu complet d'un message Gmail ───────────────────────────
const extractGmailContent = (msg: any): string => {
  // 1. Champs directs (déjà décodés par le webhook)
  if (msg.content && msg.content.trim()) return msg.content;
  if (msg.body   && msg.body.trim())    return msg.body;
  if (msg.text   && msg.text.trim())    return msg.text;

  // 2. Payload Gmail API (base64url encodé)
  const payload = msg.payload;
  if (payload) {
    // Recherche récursive dans les parts
    const findText = (parts: any[]): string => {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          const decoded = decodeBase64url(part.body.data);
          if (decoded.trim()) return decoded;
        }
        if (part.parts) {
          const nested = findText(part.parts);
          if (nested) return nested;
        }
      }
      // Fallback: text/html si aucun text/plain trouvé
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const decoded = decodeBase64url(part.body.data);
          // Supprimer les balises HTML basiques
          if (decoded.trim()) return decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
      return '';
    };

    // Corps simple (non multipart)
    if (payload.body?.data) {
      const decoded = decodeBase64url(payload.body.data);
      if (decoded.trim()) return decoded;
    }

    // Corps multipart
    if (payload.parts?.length) {
      const found = findText(payload.parts);
      if (found) return found;
    }
  }

  // 3. Dernier recours : snippet (tronqué ~200 chars)
  return msg.snippet || '[Contenu indisponible]';
};

// ─── Extrait un header spécifique d'un message Gmail ─────────────────────────
const getHeader = (msg: any, name: string): string => {
  const headers = msg.payload?.headers || msg.headers || [];
  if (Array.isArray(headers)) {
    const found = headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase());
    return found?.value || '';
  }
  return '';
};

// ─── Construit le thread complet ──────────────────────────────────────────────
const buildThreadFull = async (
  item: Reponse,
  envoiList: MailEnvoi[],
  relanceList: Relance[]
): Promise<ThreadMessage[]> => {
  try {
    const response = await api.post(WEBHOOK_THREAD_URL, {
      threadId: item.threadId,
    });

    console.log("THREAD RAW =", response.data);

    // Normalisation récursive pour extraire les messages (gère n8n .json, tableaux imbriqués, etc.)
    const normalize = (data: any): any[] => {
      if (!data) return [];
      if (Array.isArray(data)) {
        return data.flatMap(item => normalize(item));
      }
      if (data.json) return normalize(data.json);
      if (data.messages) return normalize(data.messages);
      if (data.data && Array.isArray(data.data)) return normalize(data.data);
      
      // Si c'est un objet message (id ou payload présent)
      if (data.id || data.payload || data.snippet) return [data];
      return [];
    };

    const threadData = normalize(response.data);
    console.log("THREAD NORMALIZED =", threadData);

    const messages: ThreadMessage[] = threadData.map((msg: any) => {
      const labels = msg.labelIds || msg.labels || [];
      const isSent = Array.isArray(labels) && labels.some((l: any) => {
        const name = (typeof l === 'string' ? l : l.name || '').toUpperCase();
        return name === 'SENT';
      });
      
      const type: ThreadMessage['type'] = isSent ? 'sent' : 'received';
      const ts = Number(msg.internalDate || 0);
      const content = extractGmailContent(msg);

      return {
        id: msg.id || crypto.randomUUID(),
        type,
        from: getHeader(msg, 'From') || msg.From || msg.from || '[Expéditeur inconnu]',
        to: getHeader(msg, 'To') || msg.To || msg.to || '[Destinataire inconnu]',
        content,
        date: ts ? new Date(ts).toLocaleString('fr-FR') : 'Date inconnue',
        label: type === 'sent' ? 'Message envoyé' : 'Réponse reçue',
        sortKey: String(ts),
      };
    });

    // ─── Ajout des données locales (Envois et Relances) ───────────────────────
    const contactEmail = (item.expediteur || '').toLowerCase().trim();
    const existingIds = new Set(threadData.map(m => m.id));

    // Ajouter l'envoi initial s'il n'est pas déjà là
    envoiList
      .filter(e => (e.email || '').toLowerCase().trim() === contactEmail)
      .forEach(e => {
        const gid = e.mailID || e.mailid;
        if (gid && existingIds.has(gid)) return;
        
        const ts = toTimestamp(e.created_at);
        messages.push({
          id: `envoi-${e.id}`,
          type: 'sent',
          from: 'Notre équipe',
          to: e.email,
          content: '[Message initial envoyé]', // On pourrait chercher le template ici si besoin
          date: formatDate(e.created_at),
          label: 'Message initial',
          sortKey: String(ts),
        });
      });

    // Ajouter les relances
    relanceList
      .filter(r => (r.email || '').toLowerCase().trim() === contactEmail)
      .forEach(r => {
        const ts = toTimestamp(r.date_reception || r.date_reponse);
        messages.push({
          id: `relance-${r.id}`,
          type: 'relance' as any,
          from: 'Notre équipe',
          to: r.email,
          content: r.contenu || '[Relance sans contenu]',
          date: formatDate(r.date_reception || r.date_reponse),
          label: 'Relance envoyée',
          sortKey: String(ts),
        });
      });

    // ─── Tri final par date ──────────────────────────────────────────────────
    messages.sort((a, b) => Number(a.sortKey) - Number(b.sortKey));

    return messages;
  } catch (err) {
    console.error("Erreur récupération thread :", err);
    toast({
      title: 'Erreur de récupération',
      description: "Impossible de récupérer le thread. Veuillez réessayer plus tard.",
      variant: 'destructive',
    });
    return [];
  }
};


const ReponduBadge: React.FC<{ reponse: boolean | string }> = ({ reponse }) => {
  if (isRepondu(reponse)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <CheckCircle2 className="h-3 w-3" /> Répondu
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
      <CircleDashed className="h-3 w-3" /> Non répondu
    </span>
  );
};

const MessageBubble: React.FC<{ msg: ThreadMessage; defaultOpen?: boolean }> = ({ msg, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const isReceived = msg.type === 'received';
  const isAI = msg.type === 'ai_draft';
  const displayName = isReceived ? msg.from : 'Notre équipe';

  const avatarBg = isReceived ? 'bg-slate-200 text-slate-600'
    : isAI ? 'bg-violet-200 text-violet-700'
      : 'bg-blue-200 text-blue-700';

  const cardStyle = isReceived ? 'bg-slate-100 border-slate-200'
    : isAI ? 'bg-violet-100/60 border-violet-200 border-dashed'
      : 'bg-blue-100/60 border-blue-200';

  const labelStyle = isReceived ? 'bg-slate-200 text-slate-600 border-slate-300'
    : isAI ? 'bg-violet-200 text-violet-700 border-violet-300'
      : 'bg-blue-200 text-blue-700 border-blue-300';

  return (
    <div className={`flex gap-3 ${!isReceived ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/50 ${avatarBg}`}>
        {isReceived ? <User className="h-3.5 w-3.5" />
          : isAI ? <Bot className="h-3.5 w-3.5" />
            : <Building2 className="h-3.5 w-3.5" />}
      </div>
      <div className={`flex-1 rounded-xl border shadow-sm max-w-[88%] ${cardStyle}`}>
        <button onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 transition text-left">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {isAI && <Sparkles className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
            <span className="text-sm font-medium text-slate-700 truncate flex-1">{displayName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 whitespace-nowrap ${labelStyle}`}>
              {msg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-xs text-slate-500">{msg.date}</span>
            {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
          </div>
        </button>
        {open && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-200">
            {msg.to && <p className="text-xs text-slate-500 mb-2">À : <span className="text-slate-600">{msg.to}</span></p>}
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ThreadModalProps {
  reponse: Reponse;
  envoiList: MailEnvoi[];
  relanceList: Relance[];
  onClose: () => void;
  onOpenReply: () => void;
}

const ThreadModal: React.FC<ThreadModalProps> = ({ reponse, envoiList, relanceList, onClose, onOpenReply }) => {
  const [loading, setLoading] = useState(true);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchThread = async () => {
      setLoading(true);
      const fetchedThread = await buildThreadFull(reponse, envoiList, relanceList);
      setThread(fetchedThread);
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    fetchThread();
  }, [reponse, envoiList, relanceList]);

  const statutColor = reponse.statut === 'Intéressé' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : reponse.statut === 'Non intéressé' ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-semibold">{reponse.sujet}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-sm text-slate-500">
                {reponse.expediteur}{reponse.entreprise !== 'Inconnue' && ` · ${reponse.entreprise}`}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statutColor}`}>{reponse.statut}</span>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Tag className="h-3 w-3" /> {reponse.categorie}
              </span>
              <ReponduBadge reponse={reponse.reponse} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {thread.length} message{thread.length > 1 ? 's' : ''} dans ce thread
              {reponse.threadId && <> · ID : <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-500">{reponse.threadId}</code></>}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="h-10 w-10 animate-spin" />
              <p className="text-sm">Chargement du thread…</p>
            </div>
          ) : thread.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Mail className="h-10 w-10 opacity-30" />
              <p className="text-sm">Aucun contenu disponible pour ce thread</p>
            </div>
          ) : (
            <div className="relative space-y-3">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-100 to-transparent pointer-events-none" />
              {thread.map((msg, idx) => (
                <MessageBubble key={msg.id} msg={msg} defaultOpen={idx === thread.length - 1} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="bg-card flex items-center justify-between gap-3 p-4 border-t border-slate-100 rounded-b-2xl shrink-0">
          <span className="text-xs text-slate-400">
            {isRepondu(reponse.reponse) ? '✅ Une réponse a déjà été envoyée' : "⏳ Aucune réponse envoyée pour l'instant"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
            <Button size="sm" className="gap-2"
              variant={isRepondu(reponse.reponse) ? 'outline' : 'default'}
              onClick={() => { onClose(); onOpenReply(); }}>
              <Send className="h-3.5 w-3.5" />
              {isRepondu(reponse.reponse) ? 'Répondre à nouveau' : 'Rédiger une réponse'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getTemplateByCategorie = (categorie: string, statut: string, expediteur: string, entreprise: string): string => {
  const prenom = expediteur?.split(' ')[0] ?? 'Madame/Monsieur';
  const societe = entreprise ?? 'votre société';
  const statutNorm = normalizeStatut(statut);

  const templates: Record<string, Record<string, string>> = {
    'SaaS': {
      'Intéressé': `Bonjour ${prenom},\n\nMerci pour votre retour positif concernant notre solution SaaS !\n\nNous serions ravis de vous présenter une démonstration personnalisée adaptée aux besoins de ${societe}.\n\nSeriez-vous disponible pour un échange de 30 minutes cette semaine ou la suivante ?\n\nCordialement,`,
      'Intéressé plus tard': `Bonjour ${prenom},\n\nMerci de nous avoir tenu informés.\n\nNous resterons à votre disposition dès que vous serez prêt(e) à explorer notre solution pour ${societe}.\n\nBonne continuation,`,
      'Non intéressé': `Bonjour ${prenom},\n\nMerci pour votre retour. Nous prenons bonne note.\n\nN'hésitez pas à nous recontacter si votre situation évolue.\n\nCordialement,`,
    },
    'Retail': {
      'Intéressé': `Bonjour ${prenom},\n\nMerci pour votre intérêt ! Nous serions heureux de vous montrer comment notre solution peut booster les performances retail de ${societe}.\n\nPouvons-nous convenir d'un appel ?\n\nCordialement,`,
      'Intéressé plus tard': `Bonjour ${prenom},\n\nMerci pour votre message. Nous reviendrons vers vous au moment opportun.\n\nBonne continuation,`,
      'Non intéressé': `Bonjour ${prenom},\n\nMerci pour votre transparence. Nous espérons pouvoir vous être utile à l'avenir.\n\nCordialement,`,
    },
    'Finance': {
      'Intéressé': `Bonjour ${prenom},\n\nMerci pour votre retour. Nous vous proposons un rendez-vous avec l'un de nos experts. Quelles sont vos disponibilités ?\n\nCordialement,`,
      'Intéressé plus tard': `Bonjour ${prenom},\n\nBien noté. Nous vous recontacterons à la période indiquée.\n\nCordialement,`,
      'Non intéressé': `Bonjour ${prenom},\n\nMerci de nous avoir répondu. Nous restons disponibles si vos besoins évoluent.\n\nCordialement,`,
    },
    'Industrie': {
      'Intéressé': `Bonjour ${prenom},\n\nMerci pour votre retour positif ! Un appel de découverte vous conviendrait-il cette semaine ?\n\nCordialement,`,
      'Intéressé plus tard': `Bonjour ${prenom},\n\nMerci pour votre message. Nous reviendrons vers ${societe} au bon moment.\n\nBonne continuation,`,
      'Non intéressé': `Bonjour ${prenom},\n\nMerci pour votre retour. Nous restons disponibles.\n\nCordialement,`,
    },
  };

  const generic: Record<string, string> = {
    'Intéressé': `Bonjour ${prenom},\n\nMerci pour votre retour positif ! Seriez-vous disponible pour un appel cette semaine ?\n\nCordialement,`,
    'Intéressé plus tard': `Bonjour ${prenom},\n\nMerci pour votre message. Nous reviendrons vers vous au moment opportun.\n\nBonne continuation,`,
    'Non intéressé': `Bonjour ${prenom},\n\nMerci pour votre retour. N'hésitez pas à nous recontacter si vos besoins évoluent.\n\nCordialement,`,
  };

  const categoryTemplates = templates[categorie] ?? generic;
  return categoryTemplates[statutNorm] ?? generic[statutNorm] ?? generic['Non intéressé'];
};

const WEBHOOK_URL = 'https://n8n.projets-omega.net/webhook/29180be9-dd75-410f-8726-7240a05bd849/generer_response';
const WEBHOOK_URL_REPONSE = 'https://n8n.projets-omega.net/webhook/306ef5f3-2191-49d1-a9dc-bb26c8637e68/reponse-mail';
const WEBHOOK_THREAD_URL = 'https://n8n.projets-omega.net/webhook/67f54ab7-7c46-4d47-8548-60b5a2e02a3e/recuperation_thread';


let recue = "";
let cat_envoyer = "";

const generateWithAI = async (item: Reponse): Promise<string> => {
  recue = item.contenu;
  cat_envoyer = item.categorie_env;

  try {
    const res = await api.post(WEBHOOK_URL, {
      thread: item.threadId,
      mode: 'reponse',
      mail: item.expediteur,
      mailcontent: item.contenu,
      sujet: item.sujet,
      categorie: item.categorie_env,
    }, {
      responseType: 'text',
      timeout: 300000,
    });

    const text = typeof res.data === 'string' 
      ? res.data 
      : res.data?.text || res.data?.result || res.data?.output || JSON.stringify(res.data);

    if (text?.trim()) return text.trim();

    throw new Error("Le webhook n'a pas retourné de texte exploitable." + res.data);
  } catch (error: any) {
    console.error("Erreur lors de l'appel au webhook:", error);
    toast({
      title: 'Erreur de génération IA',
      description: error?.message || "Erreur inconnue lors de l'appel au webhook.",
      variant: 'destructive',
    });
    throw new Error(error?.message || "Erreur inconnue lors de l'appel au webhook.");
  }
};

interface ReplyModalProps {
  reponse: Reponse;
  onClose: () => void;
  onSent: () => void;
}

const ReplyModal: React.FC<ReplyModalProps> = ({ reponse, onClose, onSent }) => {
  const [mailContent, setMailContent] = useState<string>(
    getTemplateByCategorie(reponse.categorie, reponse.statut, reponse.expediteur, reponse.entreprise)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(mailContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setAiGenerated(false);
    try {

      const aiText = await generateWithAI(reponse);
      setMailContent(aiText);
      setAiGenerated(true);
      toast({ title: '✨ Texte généré par IA', description: "Vous pouvez modifier le contenu avant de l'envoyer." });
    } catch (error: any) {
      const description = error?.name === 'AbortError'
        ? "Délai dépassé (3 min) — l'IA n'a pas répondu à temps."
        : error?.message ?? 'Erreur inconnue';
      toast({ title: 'Erreur de génération IA', description, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!mailContent.trim()) return;
    setIsSending(true);
    try {
      await api.post(WEBHOOK_URL_REPONSE, {
        to: reponse.expediteur,
        subject: `Re: ${reponse.sujet}`,
        body: mailContent,
        reponse_id: reponse.threadId,
        sujet: `Re: ${reponse.sujet}`,
        contenu: recue,
        dateReponse: reponse.dateReponse,
        entreprise: reponse.entreprise,
        email: reponse.expediteur,
        categorie_entreprise: reponse.categorie,
        cat_envoyer: cat_envoyer,
        reponse_par_IA: mailContent,
        thread_id: reponse.threadId,
      });

      await api.patch(`/b2b_mailsreponses/${reponse.id}`, {
        statut: reponse.statut,
        reponse: true,
      });

      toast({ title: '✅ Mail envoyé', description: `Réponse envoyée à ${reponse.expediteur}` });
      onSent();
      onClose();
    } catch (error: any) {
      toast({ title: "Erreur d'envoi", description: error?.message ?? 'Erreur inconnue', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Rédiger une réponse</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">À : {reponse.expediteur}</span>
              <Badge variant="outline" className="text-xs">{reponse.categorie}</Badge>
              <ReponduBadge reponse={reponse.reponse} />
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Objet :</span> Re: {reponse.sujet}
          </p>
        </div>

        <div className="px-5 py-2 border-b border-border bg-primary/5 flex items-center justify-between gap-3">
          <p className="text-xs text-primary">
            {aiGenerated ? '✨ Texte généré par IA — modifiable avant envoi' : `Template : catégorie ${reponse.categorie} · ${reponse.statut}`}
          </p>
          <Button variant="outline" size="sm" onClick={handleGenerateAI}
            disabled={isGenerating || isSending}
            className="gap-2 border-primary/40 text-primary hover:bg-primary/10 shrink-0">
            {isGenerating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Génération…</>
              : <><Sparkles className="h-3.5 w-3.5" />Générer avec IA</>}
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center min-h-[220px] gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">L'IA rédige votre réponse…</p>
            </div>
          ) : (
            <Textarea value={mailContent} onChange={(e) => setMailContent(e.target.value)}
              className="min-h-[220px] resize-none font-mono text-sm"
              placeholder="Rédigez votre réponse ici ou cliquez sur « Générer avec IA »…"
              disabled={isSending} />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleCopy}
            disabled={isGenerating || !mailContent.trim()} className="gap-2">
            <Copy className="h-4 w-4" />{isCopied ? 'Copié !' : 'Copier'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSending}>Annuler</Button>
            <Button onClick={handleSend} disabled={isSending || isGenerating || !mailContent.trim()} className="gap-2">
              {isSending ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi…</> : <><Send className="h-4 w-4" />Envoyer</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MailsReponses = () => {
  const [reponses, setReponses] = useState<Reponse[]>([]);
  const [envoiList, setEnvoiList] = useState<MailEnvoi[]>([]);
  const [relanceList, setRelanceList] = useState<Relance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReponse, setSelectedReponse] = useState<Reponse | null>(null);
  const [activeTab, setActiveTab] = useState('toutes');
  const [currentPage, setCurrentPage] = useState(1);
  const [replyTarget, setReplyTarget] = useState<Reponse | null>(null);
  const [threadTarget, setThreadTarget] = useState<Reponse | null>(null);

  const fetchReponses = useCallback(async () => {
    setLoading(true);
    try {
      const [resReponses, resContacts, resCategories, resEnvois, resRelances] = await Promise.all([
        api.get('/b2b_mailsreponses'),
        api.get('/b2b_datasynch'),
        api.get('/categories'),
        api.get('/realtimestatus'),
        api.get('/b2b_mailsdereponse_autoprospect'),
      ]);

      const contacts = resContacts.data ?? [];
      const categories = resCategories.data ?? [];
      setEnvoiList(resEnvois.data ?? []);
      setRelanceList(resRelances.data ?? []);

      const mappedData: Reponse[] = (resReponses.data ?? [])
        .filter((item: any) => {
          const exp = item.expediteur ?? item.Expediteur ?? item.EXPEDITEUR;
          return exp !== null && exp !== undefined && exp !== '';
        })
        .filter((item: any) => normalizeStatut(item.statut ?? '') !== 'Aucun rapport')
        .map((item: any) => {
          const expediteur = item.expediteur ?? item.Expediteur ?? 'Inconnu';
          const threadId = item.threadId ?? item.threadid ?? item.ThreadId ?? '';
          const mailOrig = item.mailOriginal ?? item.mailoriginal ?? '';
          const dateRep = item.dateReponse ?? item.datereponse ?? item.created_at ?? '';
          const repIA = item.reponse_par_IA ?? item.reponse_par_ia ?? item.reponseParIA ?? '';
          const catEnv = item.categorie_env ?? item.categorieEnv ?? '';

          const contact = contacts.find((c: any) =>
            (c.email ?? c.Mail ?? c.mail ?? '').toLowerCase().trim() === expediteur.toLowerCase().trim()
          );
          const categorieObj = categories.find((cat: any) => cat.id === contact?.category_id);
          const dateRepRaw = item.created_at ?? item.dateReponse ?? item.datereponse ?? '';
          const dateRepFormatted = item.created_at ?? item.dateReponse ?? item.datereponse ?? '';

          return {
            id: item.id,
            threadId,
            expediteur,
            sujet: item.sujet ?? 'Sans sujet',
            contenu: item.contenu ?? '',
            mailOriginal: mailOrig,
            statut: normalizeStatut(item.statut ?? ''),
            reponse: item.reponse ?? false,
            reponse_par_IA: repIA,

            entreprise: item.entreprise ?? contact?.company ?? contact?.Société ?? 'Inconnue',
            categorie: categorieObj?.name ?? item.categorie ?? 'Autre',
            categorie_env: catEnv ?? categorieObj?.env ?? 'Inconnue',
            dateReponse: formatDate(dateRepFormatted),
            dateReponseRaw: dateRepRaw
          };
        });

      setReponses(mappedData);
    } catch (err: any) {
      toast({ title: 'Erreur de chargement', description: err?.message ?? 'Impossible de charger les réponses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReponses(); }, [fetchReponses]);

  const handleSentSuccess = (id: number) => {
    setReponses(prev => prev.map(r => r.id === id ? { ...r, reponse: true } : r));
    setSelectedReponse(prev => prev?.id === id ? { ...prev, reponse: true } : prev);
    setThreadTarget(prev => prev?.id === id ? { ...prev, reponse: true } : prev);
  };

  const filteredReponses = useMemo(() => reponses.filter(r => {
    if (activeTab === 'toutes') return true;
    if (activeTab === 'interesse') return r.statut === 'Intéressé';
    if (activeTab === 'non-interesse') return r.statut === 'Non intéressé';
    if (activeTab === 'plus-tard') return r.statut === 'Intéressé plus tard';
    return true;
  }), [activeTab, reponses]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredReponses.length / ITEMS_PER_PAGE)), [filteredReponses]);
  const paginatedReponses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReponses.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReponses, currentPage]);

  useEffect(() => { setCurrentPage(1); setSelectedReponse(null); }, [activeTab]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [totalPages, currentPage]);

  const stats = useMemo(() => ({
    total: reponses.length,
    interesse: reponses.filter(r => r.statut === 'Intéressé').length,
    nonInteresse: reponses.filter(r => r.statut === 'Non intéressé').length,
    plusTard: reponses.filter(r => r.statut === 'Intéressé plus tard').length,
    dejaRepondus: reponses.filter(r => isRepondu(r.reponse)).length,
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
    const apiStatusMap: Record<string, string> = {
      'Intéressé': 'Intéressé',
      'Intéressé plus tard': 'Intéressé plus tard',
      'Non intéressé': 'Non intéressé',
    };
    const apiStatus = apiStatusMap[newStatus];
    if (!apiStatus) return;

    const previousReponses = [...reponses];
    const previousSelected = selectedReponse ? { ...selectedReponse } : null;

    setReponses(prev => prev.map(r => r.id === reponse.id ? { ...r, statut: newStatus } : r));
    if (selectedReponse?.id === reponse.id)
      setSelectedReponse(prev => prev ? { ...prev, statut: newStatus } : prev);

    try {
      await api.patch(`/b2b_mailsreponses/${reponse.id}`, { statut: apiStatus, reponse: reponse.reponse });
      toast({ title: 'Statut mis à jour', description: `Statut changé en "${newStatus}"` });
    } catch (error: any) {
      setReponses(previousReponses);
      if (previousSelected) setSelectedReponse(previousSelected);
      toast({ title: 'Erreur lors de la mise à jour', description: error?.message ?? 'Erreur inconnue', variant: 'destructive' });
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
      {threadTarget && (
        <ThreadModal
          reponse={threadTarget}
          envoiList={envoiList}
          relanceList={relanceList}
          onClose={() => setThreadTarget(null)}
          onOpenReply={() => setReplyTarget(threadTarget)}
        />
      )}
      {replyTarget && (
        <ReplyModal
          reponse={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSent={() => handleSentSuccess(replyTarget.id)}
        />
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total réponses</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-2xl font-bold text-success">{stats.interesse}</p>
            <p className="text-sm text-muted-foreground">Intéressés</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-warning" />
            <p className="text-2xl font-bold text-warning">{stats.plusTard}</p>
            <p className="text-sm text-muted-foreground">Plus tard</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <ThumbsDown className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{stats.nonInteresse}</p>
            <p className="text-sm text-muted-foreground">Non intéressés</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-2xl font-bold text-emerald-600">{stats.dejaRepondus}</p>
            <p className="text-sm text-muted-foreground">Déjà répondus</p>
          </CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="toutes">Toutes ({stats.total})</TabsTrigger>
            <TabsTrigger value="interesse">Intéressés ({stats.interesse})</TabsTrigger>
            <TabsTrigger value="plus-tard">Plus tard ({stats.plusTard})</TabsTrigger>
            <TabsTrigger value="non-interesse">Non intéressés ({stats.nonInteresse})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {paginatedReponses.map((reponse) => (
                  <Card key={reponse.id}
                    className={`cursor-pointer transition-colors hover:bg-secondary/50 ${selectedReponse?.id === reponse.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedReponse(reponse)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(reponse.statut)}
                            <h4 className="font-medium">{reponse.expediteur}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{reponse.entreprise}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {getStatusBadge(reponse.statut)}
                          <ReponduBadge reponse={reponse.reponse} />
                        </div>
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
                  <Card><CardContent className="p-8 text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Aucune réponse dans cette catégorie</p>
                  </CardContent></Card>
                )}

                {filteredReponses.length > 0 && (
                  <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages}</span>
                    <Button variant="outline" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {selectedReponse ? (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Détail de la réponse</CardTitle>
                          <div className="flex items-center gap-2">
                            <ReponduBadge reponse={selectedReponse.reponse} />
                            {getStatusBadge(selectedReponse.statut)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Informations</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Expéditeur :</span> {selectedReponse.expediteur}</p>
                            <p><span className="font-medium">Entreprise :</span> {selectedReponse.entreprise}</p>
                            <p><span className="font-medium">Catégorie :</span> <Badge variant="outline" className="ml-1">{selectedReponse.categorie}</Badge></p>
                            <p><span className="font-medium">Date :</span> {selectedReponse.dateReponse}</p>
                            <p className="flex items-center gap-2"><span className="font-medium">Statut réponse :</span><ReponduBadge reponse={selectedReponse.reponse} /></p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Sujet</h4>
                          <p className="text-sm bg-muted p-3 rounded-md">{selectedReponse.sujet}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Contenu de la réponse reçue</h4>
                          <p className="text-sm bg-card border border-border p-3 rounded-md whitespace-pre-wrap">{selectedReponse.contenu}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Mail original envoyé</h4>
                          <p className="text-sm bg-muted/50 p-3 rounded-md text-muted-foreground whitespace-pre-wrap">
                            {selectedReponse.mailOriginal || 'Non disponible'}
                          </p>
                        </div>
                        {(() => {
                          const relances = relanceList.filter(r => (r.email ?? '').toLowerCase().trim() === selectedReponse.expediteur.toLowerCase().trim());
                          if (relances.length === 0) return null;
                          return (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-amber-500" />Relances ({relances.length})
                              </h4>
                            </div>
                          );
                        })()}
                        {selectedReponse.reponse_par_IA && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-violet-500" />
                              {isRepondu(selectedReponse.reponse) ? 'Réponse envoyée par IA' : '⏳ Brouillon IA (non envoyé — cliquez Rédiger une réponse)'}
                            </h4>
                            <p className={`text-sm p-3 rounded-md whitespace-pre-wrap border ${isRepondu(selectedReponse.reponse)
                                ? 'bg-blue-50 border-blue-200 text-blue-800'
                                : 'bg-violet-50 border-violet-200 border-dashed text-violet-800'
                              }`}>
                              {selectedReponse.reponse_par_IA}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full gap-2" variant="outline" onClick={() => setThreadTarget(selectedReponse)}>
                          <MessageSquare className="h-4 w-4" />
                          Voir la conversation complète
                        </Button>

                        <Button className="w-full gap-2"
                          onClick={() => setReplyTarget(selectedReponse)}
                          variant={isRepondu(selectedReponse.reponse) ? 'outline' : 'default'}>
                          <Send className="h-4 w-4" />
                          {isRepondu(selectedReponse.reponse) ? 'Répondre à nouveau' : 'Rédiger une réponse'}
                          <Badge variant="secondary" className="ml-1 text-xs">{selectedReponse.categorie_env}</Badge>
                        </Button>

                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Changer le statut :</h5>
                          <div className="flex flex-wrap gap-2">
                            <Button variant={selectedReponse.statut === 'Intéressé' ? 'default' : 'outline'} size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Intéressé')} className="gap-2">
                              <ThumbsUp className="h-3 w-3" /> Intéressé
                            </Button>
                            <Button variant={selectedReponse.statut === 'Intéressé plus tard' ? 'default' : 'outline'} size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Intéressé plus tard')} className="gap-2">
                              <Clock className="h-3 w-3" /> Plus tard
                            </Button>
                            <Button variant={selectedReponse.statut === 'Non intéressé' ? 'destructive' : 'outline'} size="sm"
                              onClick={() => handleChangeStatus(selectedReponse, 'Non intéressé')} className="gap-2">
                              <ThumbsDown className="h-3 w-3" /> Non intéressé
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card><CardContent className="p-8 text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Sélectionnez une réponse pour voir les détails</p>
                  </CardContent></Card>
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