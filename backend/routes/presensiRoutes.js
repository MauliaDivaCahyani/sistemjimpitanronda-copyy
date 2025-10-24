import express from "express";
import {
  getAllPresensi,
  getPresensiById,
  createPresensi,
  updatePresensi,
  deletePresensi,
} from "../controllers/presensiController.js";

const router = express.Router();

router.get("/", getAllPresensi);
router.get("/:id", getPresensiById);
router.post("/", createPresensi);
router.put("/:id", updatePresensi);
router.delete("/:id", deletePresensi);

export default router;
