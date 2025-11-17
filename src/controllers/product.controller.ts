import { Request, Response } from "express";
import pool from "../config/database";

/*----------------------------------
Get all product
-----------------------------------*/
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy sản phẩm" });
  }
};

/*----------------------------------
Get product by id
-----------------------------------*/
export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }
  } catch (err) {
    res.status(500).json({ error: "Lỗi khi lấy sản phẩm" });
  }
};

/*----------------------------------
Create Product
-----------------------------------*/
export const createProduct = async (req: Request, res: Response) => {
  const { title, originalPrice, price, discount, tag, image, category } =
    req.body;

  try {
    const result = await pool.query(
      `INSERT INTO products 
        (title, originalPrice, price, discount, tag, image, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [title, originalPrice, price, discount, tag, image, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Lỗi khi thêm sản phẩm" });
  }
};

/*----------------------------------
Update product
-----------------------------------*/
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, originalPrice, price, discount, tag, image, category } =
    req.body;

  try {
    const result = await pool.query(
      `UPDATE products 
         SET title=$1, originalPrice=$2, price=$3, discount=$4, tag=$5, image=$6, category=$7
       WHERE id=$8
       RETURNING *`,
      [title, originalPrice, price, discount, tag, image, category, id]
    );

    if (result.rowCount && result.rowCount > 0) {
      res.json({ message: "Cập nhật sản phẩm thành công" });
    } else {
      res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Lỗi khi cập nhật sản phẩm" });
  }
};

/*----------------------------------
Delete product
-----------------------------------*/
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);

    if (result.rowCount && result.rowCount > 0) {
      res.json({ message: "Xóa sản phẩm thành công" });
    } else {
      res.status(404).json({ error: "Sản phẩm không tồn tại" });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Lỗi khi xóa sản phẩm" });
  }
};
