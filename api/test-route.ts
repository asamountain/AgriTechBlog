import type { Request, Response } from 'express';

export default function handler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    message: 'Test route working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
} 