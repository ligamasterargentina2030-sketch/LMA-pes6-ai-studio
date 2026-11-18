import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore';
import { db, formatFirestoreError, OperationType, testFirestoreConnection } from '../firebase';
import type { CommunityVideo } from '../types';

function parseFecha(rawFecha: unknown): { fechaMs: number; fechaLabel: string } {
  let dateObj: Date | null = null;
  if (rawFecha && typeof (rawFecha as Timestamp).toDate === 'function') {
    dateObj = (rawFecha as Timestamp).toDate();
  } else if (typeof rawFecha === 'number') {
    dateObj = new Date(rawFecha);
  } else if (typeof rawFecha === 'string' && rawFecha.trim()) {
    const parsed = new Date(rawFecha);
    if (!Number.isNaN(parsed.getTime())) dateObj = parsed;
  }

  if (!dateObj) {
    const now = new Date();
    return {
      fechaMs: now.getTime(),
      fechaLabel: 'Recién publicado',
    };
  }

  return {
    fechaMs: dateObj.getTime(),
    fechaLabel: dateObj.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export function useCommunityVideos() {
  const [communityVideos, setCommunityVideos] = useState<CommunityVideo[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    void testFirestoreConnection();

    const videosRef = collection(db, 'videos_comunidad');
    const q = query(videosRef, orderBy('fecha', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: CommunityVideo[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as {
            titulo?: string;
            autor?: string;
            videoUrl?: string;
            fecha?: unknown;
          };
          const { fechaMs, fechaLabel } = parseFecha(data.fecha);
          return {
            id: docSnap.id,
            titulo: String(data.titulo || 'Video de la comunidad'),
            autor: String(data.autor || 'Miembro'),
            videoUrl: String(data.videoUrl || ''),
            fechaMs,
            fechaLabel,
          };
        });
        items.sort((a, b) => b.fechaMs - a.fechaMs);
        setCommunityVideos(items);
        setLoadingCommunity(false);
        setFirestoreError(null);
      },
      (error) => {
        setLoadingCommunity(false);
        setFirestoreError(formatFirestoreError(error, OperationType.LIST, 'videos_comunidad'));
      }
    );

    return () => unsubscribe();
  }, []);

  return { communityVideos, loadingCommunity, firestoreError };
}
