import { Router } from 'express';
import { uploadVideo, listVideos, getVideo, deleteVideo } from '../controllers/videoController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.post('/upload', upload.single('video'), uploadVideo);
router.get('/', listVideos);
router.get('/:id', getVideo);
router.delete('/:id', deleteVideo);

export default router;
