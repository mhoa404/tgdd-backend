import { Router, Request, Response, NextFunction } from "express";
import pool from "../config/database";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

/*----------------------------------
Types
-----------------------------------*/
interface TypedRequestHandler {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

/*----------------------------------
Get all request support
-----------------------------------*/
const getAllRequests: TypedRequestHandler = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM support_requests
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hỗ trợ:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

/*----------------------------------
Reply to request
-----------------------------------*/
const replyToRequest: TypedRequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    // Lấy thông tin yêu cầu để gửi thông báo
    const reqResult = await pool.query(
      `SELECT email, topic
       FROM support_requests
       WHERE id = $1`,
      [id]
    );

    if (reqResult.rows.length === 0) {
      res.status(404).json({ error: "Không tìm thấy yêu cầu hỗ trợ" });
      return;
    }

    const request = reqResult.rows[0];

    // Update reply + status
    await pool.query(
      `UPDATE support_requests
       SET reply = $1, status = 'replied', replied_at = NOW()
       WHERE id = $2`,
      [reply, id]
    );

    // Tạo notification
    await pool.query(
      `INSERT INTO notifications (user_email, title, message, is_read)
       VALUES ($1, $2, $3, FALSE)`,
      [request.email, `Phản hồi cho yêu cầu: ${request.topic}`, reply]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi phản hồi:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

/*----------------------------------
Create request support handler
-----------------------------------*/
const createRequest: TypedRequestHandler = async (req, res) => {
  try {
    const { name, email, topic, message } = req.body;

    if (!name || !email || !topic || !message) {
      res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin." });
      return;
    }

    await pool.query(
      `INSERT INTO support_requests (name, email, topic, message)
       VALUES ($1, $2, $3, $4)`,
      [name, email, topic, message]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu hỗ trợ:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

/*----------------------------------
Routes
-----------------------------------*/
router.get("/", adminAuth, getAllRequests);
router.post("/:id/reply", adminAuth, replyToRequest);
router.post("/", createRequest);

export default router;
