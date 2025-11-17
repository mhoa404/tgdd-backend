import { Router, Request, Response } from "express";
import pool from "../config/database";
import { adminAuth } from "../middleware/adminAuth";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUser,
} from "../controllers/user.controller";

const router = Router();

/*--------------------------------------
 Lấy danh sách yêu cầu nạp tiền
---------------------------------------*/
router.get("/deposits", adminAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT dr.*, u.email AS user_email
       FROM deposit_requests dr
       JOIN users u ON dr.user_id = u.id
       ORDER BY dr.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách nạp tiền:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

/*--------------------------------------
 Duyệt yêu cầu nạp tiền
---------------------------------------*/
router.put(
  "/deposits/:id/approve",
  adminAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Lấy bản ghi deposit
      const depositResult = await pool.query(
        `SELECT * FROM deposit_requests 
         WHERE id = $1 AND status = 'pending'`,
        [id]
      );

      if (depositResult.rows.length === 0) {
        res.status(404).json({
          error: "Không tìm thấy yêu cầu hoặc đã được xử lý",
        });
        return;
      }

      const deposit = depositResult.rows[0];

      // BẮT ĐẦU TRANSACTION
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Cập nhật trạng thái deposit → approved
        await client.query(
          `UPDATE deposit_requests 
           SET status = 'approved'
           WHERE id = $1`,
          [id]
        );

        // Tạo ví nếu chưa có
        await client.query(
          `INSERT INTO wallets (user_id, balance)
           VALUES ($1, 0)
           ON CONFLICT (user_id) DO NOTHING`,
          [deposit.user_id]
        );

        // Cộng tiền vào ví
        await client.query(
          `UPDATE wallets 
           SET balance = balance + $1 
           WHERE user_id = $2`,
          [deposit.amount, deposit.user_id]
        );

        await client.query("COMMIT");

        console.log(
          `Đã duyệt nạp tiền: User ${deposit.user_id}, Amount: ${deposit.amount}`
        );

        res.json({ success: true });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Lỗi duyệt yêu cầu:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  }
);

/*--------------------------------------
 Từ chối yêu cầu nạp tiền
---------------------------------------*/
router.put(
  "/deposits/:id/reject",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      await pool.query(
        `UPDATE deposit_requests 
         SET status = 'rejected' 
         WHERE id = $1`,
        [id]
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Lỗi từ chối yêu cầu:", error);
      res.status(500).json({ error: "Lỗi server" });
    }
  }
);

/*--------------------------------------
 User management
---------------------------------------*/
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:id", adminAuth, getUserById);
router.post("/users", adminAuth, createUser);
router.put("/users/:id", adminAuth, updateUser);
router.delete("/users/:id", adminAuth, deleteUser);

export default router;
