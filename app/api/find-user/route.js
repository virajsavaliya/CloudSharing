// Example for pages/api/find-user.js or app/api/find-user/route.js

import { db } from '../../../firebaseConfig'; // Adjust path as needed
import { collection, query, where, getDocs } from 'firebase/firestore';

// For Pages Router:
// export default async function handler(req, res) { ... }

// For App Router (using Next.js 13+):
export async function GET(req) { // Use GET for the App Router
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response(JSON.stringify({ error: 'Chat ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const q = query(collection(db, 'users'), where('chatId', '==', chatId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      return new Response(JSON.stringify({ user: userData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'User not found with this Chat ID.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error("Error finding user:", error);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}