import { Router } from 'express';
import authRoutes from './auth.routes.js';
import categoriesRoutes from './categories.routes.js';
import transactionsRoutes from './transactions.routes.js';
import usersRoutes from './users.routes.js';
import googleCalendarRoutes from './googleCalendar.routes.js';
import meiGuideRoutes from './mei-guide.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/google-calendar', googleCalendarRoutes);
router.use('/mei-guide', meiGuideRoutes);

export default router;
