import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';


export const healthRouter = Router();


healthRouter.get('/health', (_req, res) => {
res.status(StatusCodes.OK).json({ ok: true, ts: Date.now() });
});