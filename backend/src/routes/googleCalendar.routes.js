import { Router } from 'express';
import { proxyGoogleCalendar } from '../controllers/googleCalendar.controller.js';

const router = Router();

router.all('/:path', proxyGoogleCalendar);

export default router;
