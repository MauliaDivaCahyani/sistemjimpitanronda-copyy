import express from "express";
import {
  getAllLaporan,
  getLaporanById,
  createLaporan,
  updateLaporan,
  deleteLaporan,
  generateLaporan,
} from "../controllers/laporanController.js";

const router = express.Router();

router.get("/generate", generateLaporan);
router.get("/", getAllLaporan);
router.get("/:id", getLaporanById);
router.post("/", createLaporan);
router.put("/:id", updateLaporan);
router.delete("/:id", deleteLaporan);

export default router;
