import express from "express";
import {
  getAllPetugas,
  getPetugasById,
  createPetugas,
  updatePetugas,
  deletePetugas,
} from "../controllers/petugasController.js";

const router = express.Router();

router.get("/", getAllPetugas);
router.get("/:id", getPetugasById);
router.post("/", createPetugas);
router.put("/:id", updatePetugas);
router.delete("/:id", deletePetugas);

export default router;
