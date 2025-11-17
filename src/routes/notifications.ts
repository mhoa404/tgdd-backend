import express from 'express';
import pool from '../config/database';

const router = express.Router();

/*----------------------------------
Lấy thông báo theo email
-----------------------------------*/
router.get('/:email', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * 
       FROM notifications 
       WHERE user_email = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.params.email]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Lỗi lấy thông báo:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

/*----------------------------------
Đánh dấu thông báo đã đọc
-----------------------------------*/
router.put('/:id/read', async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1`,
      [req.params.id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Lỗi cập nhật thông báo:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;
