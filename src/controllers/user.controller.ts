import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, email, role, phone, address, birth_date, gender, avatar, updated_at
       FROM users
       ORDER BY updated_at DESC`
    );
    res.json(rows);
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
    return;
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const [rows] = await pool.execute(
      `SELECT id, first_name, last_name, email, role, phone, address, birth_date, gender, avatar, updated_at
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    const user = (rows as any[])[0] || null;
    res.json(user);
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
    return;
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, password, role, phone, address, birth_date, gender, avatar } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email và password là bắt buộc' });
      return;
    }

    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if ((exists as any[]).length > 0) {
      res.status(409).json({ error: 'Email đã tồn tại' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      `INSERT INTO users (first_name, last_name, email, password, role, phone, address, birth_date, gender, avatar, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [first_name || null, last_name || null, email, hashed, role || 'user', phone || null, address || null, birth_date || null, gender || null, avatar || null]
    );

    res.status(201).json({ success: true });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
    return;
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { first_name, last_name, role, phone, address, birth_date, gender, avatar } = req.body;
    await pool.execute(
      `UPDATE users SET first_name = ?, last_name = ?, role = ?, phone = ?, address = ?, birth_date = ?, gender = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [first_name || null, last_name || null, role || null, phone || null, address || null, birth_date || null, gender || null, avatar || null, id]
    );
    res.json({ success: true });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
    return;
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    await pool.execute(`DELETE FROM users WHERE id = ?`, [id]);
    res.json({ success: true });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
    return;
  }
};