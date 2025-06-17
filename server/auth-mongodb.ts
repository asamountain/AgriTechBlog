import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import type { Express } from 'express';
import type { User } from '@shared/schema';
import { mongoHighlightStorage } from './mongodb-highlight-storage';

// Configure session middleware with persistent storage
export function setupSession(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

export function setupAuth(app: Express) {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser(async (user: any, done) => {
    try {
      // Get fresh user data from MongoDB
      await mongoHighlightStorage.connect();
      const dbUser = await mongoHighlightStorage.getUser(user.id);
      await mongoHighlightStorage.disconnect();
      done(null, dbUser || user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://54037cb7-11dd-4327-b4c8-0182009521c3-00-2xwgdjgm9t82u.janeway.replit.dev/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await mongoHighlightStorage.connect();
        
        // Check if user exists or create new one
        const user = await mongoHighlightStorage.upsertUser({
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || '',
          avatar: profile.photos?.[0]?.value,
          provider: 'google'
        });

        await mongoHighlightStorage.disconnect();
        done(null, user);
      } catch (error) {
        await mongoHighlightStorage.disconnect();
        done(error, null);
      }
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "https://54037cb7-11dd-4327-b4c8-0182009521c3-00-2xwgdjgm9t82u.janeway.replit.dev/auth/github/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await mongoHighlightStorage.connect();
        
        // Check if user exists or create new one
        const user = await mongoHighlightStorage.upsertUser({
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || profile.username || '',
          avatar: profile.photos?.[0]?.value,
          provider: 'github'
        });

        await mongoHighlightStorage.disconnect();
        done(null, user);
      } catch (error) {
        await mongoHighlightStorage.disconnect();
        done(error, null);
      }
    }));
  }

  // Middleware to save return URL
  app.use('/auth/google', (req, res, next) => {
    if (req.query.returnTo) {
      (req.session as any).returnTo = req.query.returnTo;
    }
    next();
  });

  app.use('/auth/github', (req, res, next) => {
    if (req.query.returnTo) {
      (req.session as any).returnTo = req.query.returnTo;
    }
    next();
  });

  // Auth routes
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      // Get the return URL from session or default to home
      const returnTo = (req.session as any)?.returnTo || '/';
      delete (req.session as any)?.returnTo;
      res.redirect(returnTo);
    }
  );

  app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    (req, res) => {
      // Get the return URL from session or default to home
      const returnTo = req.session?.returnTo || '/';
      delete req.session?.returnTo;
      res.redirect(returnTo);
    }
  );

  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}