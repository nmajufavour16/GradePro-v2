import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';

const app = express();
const PORT = 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-key';

// Initialize SQLite database
const db = new Database('database.sqlite');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    displayName TEXT,
    photoURL TEXT,
    targetCGPA REAL,
    gradingScale REAL,
    institution TEXT,
    faculty TEXT,
    department TEXT,
    level TEXT,
    role TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY,
    userId TEXT,
    level TEXT,
    name TEXT,
    createdAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(uid)
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    userId TEXT,
    semesterId TEXT,
    code TEXT,
    title TEXT,
    units INTEGER,
    grade TEXT,
    score REAL,
    gradePoint REAL,
    isCarryover INTEGER,
    createdAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(uid),
    FOREIGN KEY(semesterId) REFERENCES semesters(id)
  );

  CREATE TABLE IF NOT EXISTS chatSessions (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(uid)
  );

  CREATE TABLE IF NOT EXISTS chatMessages (
    id TEXT PRIMARY KEY,
    chatId TEXT,
    userId TEXT,
    role TEXT,
    content TEXT,
    createdAt TEXT,
    FOREIGN KEY(chatId) REFERENCES chatSessions(id),
    FOREIGN KEY(userId) REFERENCES users(uid)
  );
`);

app.use(express.json());
app.use(cookieParser());

// Authentication Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, SESSION_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- Auth Routes ---

app.get('/api/auth/url', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.id_token) throw new Error('Failed to get id_token');

    // Decode JWT (Google's id_token)
    const userInfo = jwt.decode(tokenData.id_token) as any;
    const uid = userInfo.sub;

    // Create or update user
    const stmt = db.prepare('SELECT * FROM users WHERE uid = ?');
    let user = stmt.get(uid) as any;

    if (!user) {
      const insert = db.prepare(`
        INSERT INTO users (uid, email, displayName, photoURL, targetCGPA, gradingScale, role, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        uid,
        userInfo.email,
        userInfo.name,
        userInfo.picture,
        4.5,
        5.0,
        userInfo.email === 'nmajufavour16@gmail.com' ? 'admin' : 'user',
        new Date().toISOString()
      );
      user = db.prepare('SELECT * FROM users WHERE uid = ?').get(uid);
    }

    // Create session token
    const sessionToken = jwt.sign({ uid, email: user.email }, SESSION_SECRET, { expiresIn: '7d' });
    
    res.cookie('token', sessionToken, {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

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
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { secure: true, sameSite: 'none', httpOnly: true });
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, (req: any, res) => {
  const user = db.prepare('SELECT * FROM users WHERE uid = ?').get(req.user.uid);
  res.json(user);
});

app.put('/api/users/me', authenticate, (req: any, res) => {
  const { displayName, targetCGPA, gradingScale, institution, faculty, department, level } = req.body;
  const stmt = db.prepare(`
    UPDATE users 
    SET displayName = COALESCE(?, displayName),
        targetCGPA = COALESCE(?, targetCGPA),
        gradingScale = COALESCE(?, gradingScale),
        institution = COALESCE(?, institution),
        faculty = COALESCE(?, faculty),
        department = COALESCE(?, department),
        level = COALESCE(?, level)
    WHERE uid = ?
  `);
  stmt.run(displayName, targetCGPA, gradingScale, institution, faculty, department, level, req.user.uid);
  const user = db.prepare('SELECT * FROM users WHERE uid = ?').get(req.user.uid);
  res.json(user);
});

// --- Data Routes ---

app.get('/api/semesters', authenticate, (req: any, res) => {
  const semesters = db.prepare('SELECT * FROM semesters WHERE userId = ? ORDER BY createdAt ASC').all(req.user.uid);
  res.json(semesters);
});

app.post('/api/semesters', authenticate, (req: any, res) => {
  const id = crypto.randomUUID();
  const { level, name } = req.body;
  const stmt = db.prepare('INSERT INTO semesters (id, userId, level, name, createdAt) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, req.user.uid, level, name, new Date().toISOString());
  res.json({ id, userId: req.user.uid, level, name });
});

app.put('/api/semesters/:id', authenticate, (req: any, res) => {
  const { level, name } = req.body;
  const stmt = db.prepare('UPDATE semesters SET level = COALESCE(?, level), name = COALESCE(?, name) WHERE id = ? AND userId = ?');
  stmt.run(level, name, req.params.id, req.user.uid);
  res.json({ success: true });
});

app.delete('/api/semesters/:id', authenticate, (req: any, res) => {
  db.prepare('DELETE FROM courses WHERE semesterId = ? AND userId = ?').run(req.params.id, req.user.uid);
  db.prepare('DELETE FROM semesters WHERE id = ? AND userId = ?').run(req.params.id, req.user.uid);
  res.json({ success: true });
});

app.get('/api/courses', authenticate, (req: any, res) => {
  const courses = db.prepare('SELECT * FROM courses WHERE userId = ?').all(req.user.uid);
  // Convert boolean back
  const formatted = courses.map((c: any) => ({ ...c, isCarryover: Boolean(c.isCarryover) }));
  res.json(formatted);
});

app.post('/api/courses', authenticate, (req: any, res) => {
  const id = crypto.randomUUID();
  const { semesterId, code, title, units, grade, score, gradePoint, isCarryover } = req.body;
  const stmt = db.prepare(`
    INSERT INTO courses (id, userId, semesterId, code, title, units, grade, score, gradePoint, isCarryover, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, req.user.uid, semesterId, code, title, units, grade, score, gradePoint, isCarryover ? 1 : 0, new Date().toISOString());
  res.json({ id, userId: req.user.uid, semesterId, code, title, units, grade, score, gradePoint, isCarryover });
});

app.put('/api/courses/:id', authenticate, (req: any, res) => {
  const { code, title, units, grade, score, gradePoint, isCarryover } = req.body;
  const stmt = db.prepare(`
    UPDATE courses 
    SET code = COALESCE(?, code),
        title = COALESCE(?, title),
        units = COALESCE(?, units),
        grade = COALESCE(?, grade),
        score = COALESCE(?, score),
        gradePoint = COALESCE(?, gradePoint),
        isCarryover = COALESCE(?, isCarryover)
    WHERE id = ? AND userId = ?
  `);
  stmt.run(code, title, units, grade, score, gradePoint, isCarryover !== undefined ? (isCarryover ? 1 : 0) : null, req.params.id, req.user.uid);
  res.json({ success: true });
});

app.delete('/api/courses/:id', authenticate, (req: any, res) => {
  db.prepare('DELETE FROM courses WHERE id = ? AND userId = ?').run(req.params.id, req.user.uid);
  res.json({ success: true });
});

app.get('/api/metadata', (req, res) => {
  res.json({
    id: 'app-config',
    institutions: [],
    faculties: [],
    departments: [],
    courseTemplates: []
  });
});

// --- Admin Routes ---

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.email !== 'nmajufavour16@gmail.com') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

app.get('/api/admin/stats', authenticate, requireAdmin, (req: any, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const totalSemesters = db.prepare('SELECT COUNT(*) as count FROM semesters').get() as any;
  const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get() as any;
  res.json({
    totalUsers: totalUsers.count,
    totalSemesters: totalSemesters.count,
    totalCourses: totalCourses.count
  });
});

app.get('/api/admin/users', authenticate, requireAdmin, (req: any, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY createdAt DESC').all();
  res.json(users);
});

// --- Chat Routes ---

app.get('/api/chat/sessions', authenticate, (req: any, res) => {
  const sessions = db.prepare('SELECT * FROM chatSessions WHERE userId = ? ORDER BY updatedAt DESC').all(req.user.uid);
  res.json(sessions);
});

app.post('/api/chat/sessions', authenticate, (req: any, res) => {
  const id = crypto.randomUUID();
  const { title } = req.body;
  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO chatSessions (id, userId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)');
  stmt.run(id, req.user.uid, title || 'New Chat', now, now);
  res.json({ id, userId: req.user.uid, title: title || 'New Chat', createdAt: now, updatedAt: now });
});

app.put('/api/chat/sessions/:id', authenticate, (req: any, res) => {
  const { title } = req.body;
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE chatSessions SET title = COALESCE(?, title), updatedAt = ? WHERE id = ? AND userId = ?');
  stmt.run(title, now, req.params.id, req.user.uid);
  res.json({ success: true });
});

app.delete('/api/chat/sessions/:id', authenticate, (req: any, res) => {
  db.prepare('DELETE FROM chatMessages WHERE chatId = ? AND userId = ?').run(req.params.id, req.user.uid);
  db.prepare('DELETE FROM chatSessions WHERE id = ? AND userId = ?').run(req.params.id, req.user.uid);
  res.json({ success: true });
});

app.get('/api/chat/sessions/:id/messages', authenticate, (req: any, res) => {
  const messages = db.prepare('SELECT * FROM chatMessages WHERE chatId = ? AND userId = ? ORDER BY createdAt ASC').all(req.params.id, req.user.uid);
  res.json(messages);
});

app.post('/api/chat/sessions/:id/messages', authenticate, (req: any, res) => {
  const id = crypto.randomUUID();
  const { role, content } = req.body;
  const now = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO chatMessages (id, chatId, userId, role, content, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(id, req.params.id, req.user.uid, role, content, now);
  
  // Update session updatedAt
  db.prepare('UPDATE chatSessions SET updatedAt = ? WHERE id = ? AND userId = ?').run(now, req.params.id, req.user.uid);
  
  res.json({ id, chatId: req.params.id, userId: req.user.uid, role, content, createdAt: now });
});

// --- Vite Integration ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
