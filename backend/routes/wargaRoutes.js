import express from 'express';
import {
  getAllWarga,
  getWargaById,
  createWarga,
  updateWarga,
  deleteWarga,
  getKepalaKeluarga
} from '../controllers/wargaController.js';

const router = express.Router();

// Specific routes first (before dynamic routes)
router.get('/kepala-keluarga', getKepalaKeluarga); // Endpoint baru untuk kepala keluarga saja
router.get('/', getAllWarga);
router.get('/:id', getWargaById);
router.post('/', createWarga);
router.put('/:id', updateWarga);
router.delete('/:id', deleteWarga);

export default router;
