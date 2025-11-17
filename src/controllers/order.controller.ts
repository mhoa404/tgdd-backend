import { Request, Response } from "express";
import pool from "../config/database";

/*-----------------------------------------
  Create order
-------------------------------------------*/
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      productId,
      productTitle,
      productPrice,
      quantity = 1,
      paymentMethod = "cod",
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !productId ||
      !productTitle ||
      !productPrice
    ) {
      res.status(400).json({ error: "Thiếu thông tin đơn hàng" });
      return;
    }

    const totalAmount = productPrice * quantity;

    /*-----------------------------------------
      THANH TOÁN BẰNG VÍ
    -------------------------------------------*/
    if (paymentMethod === "wallet") {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        res.status(401).json({ error: "Cần đăng nhập để thanh toán bằng ví" });
        return;
      }

      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );
      const userId = decoded.userId;

      /* Kiểm tra số dư ví */
      const walletResult = await pool.query(
        "SELECT balance FROM wallets WHERE user_id = $1",
        [userId]
      );
      const wallet = walletResult.rows[0];

      if (!wallet || wallet.balance < totalAmount) {
        res.status(400).json({ error: "Số dư ví không đủ" });
        return;
      }

      /* Transaction PostgreSQL */
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        /* Tạo đơn hàng */
        await client.query(
          `INSERT INTO orders 
            (full_name, email, phone, address, product_id, product_title, product_price, status, payment_method) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed','wallet')`,
          [
            fullName,
            email,
            phone,
            address,
            productId,
            productTitle,
            productPrice,
          ]
        );

        /* Trừ ví */
        await client.query(
          "UPDATE wallets SET balance = balance - $1 WHERE user_id = $2",
          [totalAmount, userId]
        );

        /* Lịch sử giao dịch ví */
        await client.query(
          `INSERT INTO wallet_transactions (wallet_id, type, amount, description) 
           VALUES (
             (SELECT id FROM wallets WHERE user_id = $1),
             'payment',
             $2,
             $3
           )`,
          [userId, totalAmount, `Thanh toán đơn hàng: ${productTitle}`]
        );

        await client.query("COMMIT");

        res.status(200).json({
          message: "Đặt hàng & thanh toán thành công",
          paymentMethod: "wallet",
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      return;
    }

    /*-----------------------------------------
      COD – Thanh toán khi nhận hàng
    -------------------------------------------*/
    await pool.query(
      `INSERT INTO orders 
        (full_name, email, phone, address, product_id, product_title, product_price, status, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','cod')`,
      [fullName, email, phone, address, productId, productTitle, productPrice]
    );

    res.status(200).json({
      message: "Đặt hàng thành công",
      paymentMethod: "cod",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

/*-----------------------------------------
  Get all orders
-------------------------------------------*/
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Lỗi lấy đơn hàng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

/*-----------------------------------------
  Update order status
-------------------------------------------*/
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "shipping",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Trạng thái không hợp lệ" });
      return;
    }

    const result = await pool.query(
      "SELECT id, email, product_title FROM orders WHERE id = $1",
      [id]
    );

    const order = result.rows[0];
    if (!order) {
      res.status(404).json({ error: "Không tìm thấy đơn hàng" });
      return;
    }

    if (!order.email) {
      res.status(400).json({ error: "Thiếu email trong đơn hàng" });
      return;
    }

    /* Update status */
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);

    /* Gửi notification */
    await pool.query(
      `INSERT INTO notifications (user_email, title, message, is_read)
       VALUES ($1,$2,$3,FALSE)`,
      [
        order.email,
        `Cập nhật đơn hàng: ${order.product_title}`,
        `Đơn hàng của bạn đã được chuyển sang trạng thái: ${status}`,
      ]
    );

    res.json({
      success: true,
      message: "Cập nhật thành công",
      order: {
        ...order,
        status,
      },
    });
  } catch (error) {
    console.error("Lỗi cập nhật đơn hàng:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

/*-----------------------------------------
  Get order by user email
-------------------------------------------*/
export const getUserOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      "SELECT * FROM orders WHERE email = $1 ORDER BY created_at DESC",
      [email]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Lỗi lấy đơn hàng user:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
