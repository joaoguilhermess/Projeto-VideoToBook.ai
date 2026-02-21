import { Router } from 'express';
import { createBook, listBooks, getBook, deleteBook, getBookStats, exportBookPDF, exportBookWord } from '../controllers/bookController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.post('/', createBook);
router.get('/', listBooks);
router.get('/stats', getBookStats);
router.get('/:id', getBook);
router.get('/:id/export/pdf', exportBookPDF);
router.get('/:id/export/word', exportBookWord);
router.delete('/:id', deleteBook);

export default router;
