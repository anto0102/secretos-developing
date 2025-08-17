// src/utils/textParser.ts

import { db } from '../firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useRouter } from 'vue-router';

// Cache per evitare di richiedere più volte lo stesso utente a Firestore
const userCache = new Map<string, string | null>();

/**
 * Recupera l'ID di un utente dal suo username. Usa una cache per ottimizzare.
 * @param username L'username da cercare.
 * @returns L'ID dell'utente o null se non trovato.
 */
async function getUserIdByUsername(username: string): Promise<string | null> {
  if (userCache.has(username)) {
    return userCache.get(username)!;
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userId = querySnapshot.docs[0].id;
      userCache.set(username, userId);
      return userId;
    } else {
      userCache.set(username, null);
      return null;
    }
  } catch (error) {
    console.error("Errore nel recupero utente da username:", error);
    userCache.set(username, null); // Cache dell'errore per non riprovare
    return null;
  }
}

/**
 * Converte il testo con Markdown e mention in HTML, rendendo le mention cliccabili.
 * @param text Il testo da parsare.
 * @returns Una Promise che si risolve con la stringa HTML formattata.
 */
export async function parseText(text: string | undefined | null): Promise<string> {
  if (!text) return '';

  const mentionRegex = /@(\w+)/g;
  
  // Usiamo replace con una funzione asincrona per gestire le chiamate al DB
  const replacements = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const [fullMatch, username] = match;
    replacements.push(async () => {
      const userId = await getUserIdByUsername(username);
      if (userId) {
        return {
          from: fullMatch,
          to: `<a href="/profile/${userId}" data-mention="true" class="mention">@${username}</a>`
        };
      }
      return { from: fullMatch, to: fullMatch }; // Se l'utente non esiste, non fare nulla
    });
  }

  const resolvedReplacements = await Promise.all(replacements.map(r => r()));

  let parsedText = text;
  resolvedReplacements.forEach(rep => {
    parsedText = parsedText.replace(rep.from, rep.to);
  });
  
  // Applica le altre formattazioni Markdown
  parsedText = parsedText.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  parsedText = parsedText.replace(/\*(.*?)\*/g, '<i>$1</i>');
  parsedText = parsedText.replace(/__(.*?)__/g, '<u>$1</u>');
  parsedText = parsedText.replace(/~~(.*?)~~/g, '<s>$1</s>');
  parsedText = parsedText.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler-text">$1</span>');
  parsedText = parsedText.replace(/==#(.*?)==(.*?)==/g, (match, color, content) => {
    return `<mark style="background-color: #${color};">${content}</mark>`;
  });

  return parsedText;
}

/**
 * Gestisce i click sui link delle mention per navigare con Vue Router.
 * @param event L'evento click.
 * @param router L'istanza di Vue Router.
 */
export function handleMentionClick(event: MouseEvent, router: any) {
  const target = event.target as HTMLElement;
  const anchor = target.closest('a[data-mention="true"]');
  if (anchor && anchor.hasAttribute('href')) {
    event.preventDefault(); // Impedisce al link di ricaricare la pagina
    router.push(anchor.getAttribute('href')!);
  }
}