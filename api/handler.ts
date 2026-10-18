import type { Request, Response } from 'express';
import app from '../server.ts';

/** Send Vercel's rewritten API request to the existing Express router. */
export default function handler(req: Request, res: Response) {
  const route = req.query.__vercel_path;
  if (typeof route !== 'string' || !route) {
    return res.status(400).json({ error: 'Falta la ruta de la API.' });
  }

  const query = new URL(req.url || '/', 'http://vercel.local').searchParams;
  query.delete('__vercel_path');
  query.delete('route');
  const remainingQuery = query.toString();
  req.url = `/api/${route}${remainingQuery ? `?${remainingQuery}` : ''}`;
  return app(req, res);
}
