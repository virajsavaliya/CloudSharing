// pages/api/ably-token.js

import Ably from 'ably';

export default async function handler(req, res) {
  // Make sure to add ABLY_API_KEY to your Vercel Environment Variables
  if (!process.env.ABLY_API_KEY) {
    return res.status(500).json({ error: "ABLY_API_KEY environment variable not set" });
  }

  // Use a unique client ID for each user, like their user ID from your auth system
  const clientId = req.query.clientId || 'anonymous';
  
  const client = new Ably.Rest(process.env.ABLY_API_KEY);
  
  // Create a token request for the client to use
  const tokenRequestData = await client.auth.createTokenRequest({ clientId: clientId });
  
  res.status(200).json(tokenRequestData);
}