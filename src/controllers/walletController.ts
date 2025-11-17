import { Request, Response } from "express";
import pool from "../config/database";

// Tạo mã nạp tiền unique
const generateTransferCode = (userId: number): string => {
  const timestamp = Date.now().toString().slice(-6);
  const userPart = userId.toString().padStart(3, "0");
  return `NAP${userPart}${timestamp}`;
};

// Tạo yêu cầu nạp tiền
export const createDepositRequest = async (req: Request, res: Response) => {
  try {
    const { amount, proofImage } = req.body;
    const userId = req.user?.userId;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Thông tin không hợp lệ" });
    }

    const transferCode = generateTransferCode(parseInt(userId));

    await pool.query(
      `INSERT INTO deposit_requests 
        (user_id, amount, transfer_code, bank_account, proof_image) 
       VALUES ($1,$2,$3,$4,$5)`,
      [
        userId,
        amount,
        transferCode,
        "MB Bank - 0123456789 - NGUYEN VAN A",
        proofImage,
      ]
    );

    res.json({
      success: true,
      transferCode,
      bankInfo: {
        bank: "MB Bank",
        accountNumber: "0123456789",
        accountName: "NGUYEN VAN A",
        content: transferCode,
      },
    });
  } catch (error) {
    console.error("Lỗi tạo yêu cầu nạp tiền:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};

// Lấy thông tin ví
export const getWalletInfo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Tạo ví nếu chưa có (PostgreSQL version)
    await pool.query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    // Lấy thông tin ví
    const walletResult = await pool.query(
      `SELECT * FROM wallets WHERE user_id = $1`,
      [userId]
    );

    // Lịch sử nạp tiền
    const depositResult = await pool.query(
      `SELECT * FROM deposit_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      wallet: walletResult.rows[0],
      depositHistory: depositResult.rows,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin ví:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
};
