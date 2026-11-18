import { getApp, getApps, initializeApp } from 'firebase/app';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBkcALIEgL4u2i8w_GIX-NlXROkJgiTc0w",
  authDomain: "liga-master-argentina.firebaseapp.com",
  databaseURL: "https://liga-master-argentina-default-rtdb.firebaseio.com",
  projectId: "liga-master-argentina",
  storageBucket: "liga-master-argentina.firebasestorage.app",
  messagingSenderId: "495632308362",
  appId: "1:495632308362:web:f769bf97c7d9462ca83573",
  measurementId: "G-PPRPNDT1KV"
};

const app = getApps().some((a) => a.name === '[DEFAULT]')
  ? getApp()
  : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function formatFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string
): string {
  const rawMessage = error instanceof Error ? error.message : String(error);
  console.error('Firestore Error:', JSON.stringify({ error: rawMessage, operationType, path }));
  if (rawMessage.toLowerCase().includes('permission') || rawMessage.toLowerCase().includes('insufficient')) {
    return 'Firestore rechazó la operación por permisos. Revisá las reglas de seguridad de la colección videos_comunidad en Firebase.';
  }
  return `Error de Firebase Firestore (${operationType}): ${rawMessage}`;
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'videos_comunidad', '_connection_check'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firebase Firestore offline. Verificá tu conexión o configuración.');
    }
  }
}
