import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import type { Express } from 'express';

// User interface for session
interface User {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'github';
  avatar?: string;
}

// Configure session middleware with persistent storage
export function setupSession(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for persistent login
      httpOnly: true, // Prevent XSS attacks
      sameSite: 'lax' // CSRF protection
    }
  }));
}

// Configure passport strategies
export function setupAuth(app: Express) {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://tech-san.vercel.app'
      : 'http://localhost:3000';
    
    console.log('OAuth Configuration:');
    console.log('Base URL:', baseUrl);
    console.log('Callback URL:', `${baseUrl}/auth/google/callback`);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${baseUrl}/auth/google/callback`
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      const user: User = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        provider: 'google',
        avatar: profile.photos?.[0]?.value
      };
      return done(null, user);
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://tech-san.vercel.app'
      : 'http://localhost:3000';
    
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${baseUrl}/auth/github/callback`
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      const user: User = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || profile.username || '',
        provider: 'github',
        avatar: profile.photos?.[0]?.value
      };
      return done(null, user);
    }));
  }

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Auth routes
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/admin' }),
    (req, res) => {
      res.redirect('/admin');
    }
  );

  app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/admin' }),
    (req, res) => {
      res.redirect('/admin');
    }
  );

  app.get('/auth/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  // Get current user
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
}