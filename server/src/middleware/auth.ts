import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = header.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    next();
};

export const requirePrinter = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !['admin', 'printer'].includes(req.user.role)) {
        res.status(403).json({ error: 'Printer access required' });
        return;
    }
    next();
};

export const requireRider = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !['admin', 'rider'].includes(req.user.role)) {
        res.status(403).json({ error: 'Rider access required' });
        return;
    }
    next();
};

export const generateToken = (payload: AuthPayload): string => {
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: expiresIn as string | number,
    } as jwt.SignOptions);
};
