import express from "express";
import {
  getAllTransaksi,
  getTransaksiById,
  createTransaksi,
  updateTransaksi,
  deleteTransaksi,
} from "../controllers/transaksiController.js";

const router = express.Router();

router.get("/", getAllTransaksi);
router.get("/:id", getTransaksiById);
router.post("/", createTransaksi);
router.put("/:id", updateTransaksi);
router.delete("/:id", deleteTransaksi);

export default router;
