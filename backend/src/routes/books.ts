import { Router } from 'express';
import { createBook, listBooks, getBook, deleteBook, getBookStats } from '../controllers/bookController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.post('/', createBook);
router.get('/', listBooks);
router.get('/stats', getBookStats);
router.get('/:id', getBook);
router.delete('/:id', deleteBook);

export default router;
