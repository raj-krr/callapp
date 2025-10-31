import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import * as crypto from 'crypto';
import 'express-session';

// augment express-session types to include user on the session
declare module 'express-session' {
  interface SessionData {
	user?: { id: string; name: string };
  }
}

// DEV ONLY: simple session login to simulate existing cookie-based auth
export const authDevRouter = Router();


authDevRouter.post('/auth/login', (req, res) => {
  const { name } = req.body ?? {};
  if (!name) return res.status(StatusCodes.BAD_REQUEST).json({ ok: false, error: 'name required' });
  req.session.user = { id: crypto.randomUUID(), name };
  res.json({ ok: true, user: req.session.user });
});


authDevRouter.post('/auth/logout', (req, res) => {
  req.session.destroy(() => {
  res.clearCookie('sid');
  res.json({ ok: true });
  });
});


authDevRouter.get('/me', (req, res) => {
  res.json({ user: req.session.user ?? null });
});