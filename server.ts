import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieSession from 'cookie-session';
import axios from 'axios';
import dotenv from 'dotenv';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1);

  app.use(express.json());
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'default-secret-key'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    sameSite: 'none',
    httpOnly: true,
  }));

  // OAuth Routes
  app.get('/api/auth/url', (req, res) => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const appUrl = process.env.APP_URL;
    
    if (!appUrl) {
      console.error('APP_URL is not configured in environment variables');
      return res.status(500).json({ error: 'APP_URL is not configured' });
    }

    const redirectUri = `${appUrl}/auth/callback`;
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID is not configured' });
    }

    const options = {
      redirect_uri: redirectUri,
      client_id: process.env.GOOGLE_CLIENT_ID,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    };

    const qs = new URLSearchParams(options);
    res.json({ url: `${rootUrl}?${qs.toString()}` });
  });

  app.get('/auth/callback', async (req, res) => {
    const code = req.query.code as string;
    const rootUrl = 'https://oauth2.googleapis.com/token';
    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      console.error('APP_URL is not configured during callback');
      return res.status(500).send('APP_URL is not configured');
    }

    const redirectUri = `${appUrl}/auth/callback`;

    const options = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    };

    try {
      const { data } = await axios.post(rootUrl, new URLSearchParams(options).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { id_token, access_token } = data;
      const googleUser = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
        {
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        }
      ).then(res => {
        const data = res.data;
        return {
          ...data,
          uid: data.id,
        };
      });

      // Use Google's ID token directly instead of minting a custom token
      // which requires IAM Service Account Credentials API
      req.session!.user = googleUser;
      req.session!.firebaseToken = id_token;

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      const errorData = error.response?.data || error.message;
      console.error('OAuth callback error details:', JSON.stringify(errorData, null, 2));
      res.status(500).send(`Authentication failed: ${typeof errorData === 'object' ? JSON.stringify(errorData) : errorData}`);
    }
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.session?.user) {
      res.json({
        user: req.session.user,
        firebaseToken: req.session.firebaseToken,
      });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session = null;
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
