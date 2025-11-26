"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const database_1 = __importDefault(require("../config/database"));
/*----------------------------------
Get all product
-----------------------------------*/
const getAllProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query("SELECT * FROM products");
        res.json(result.rows);
    }
    catch (err) {
        res.status(500).json({ error: "Lỗi khi lấy sản phẩm" });
    }
});
exports.getAllProducts = getAllProducts;
/*----------------------------------
Get product by id
-----------------------------------*/
const getProductById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield database_1.default.query("SELECT * FROM products WHERE id = $1", [
            id,
        ]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        }
        else {
            res.status(404).json({ error: "Sản phẩm không tồn tại" });
        }
    }
    catch (err) {
        res.status(500).json({ error: "Lỗi khi lấy sản phẩm" });
    }
});
exports.getProductById = getProductById;
/*----------------------------------
Create Product
-----------------------------------*/
const createProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, originalPrice, price, discount, tag, image, category } = req.body;
    try {
        const result = yield database_1.default.query(`INSERT INTO products 
        (title, originalPrice, price, discount, tag, image, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`, [title, originalPrice, price, discount, tag, image, category]);
        res.status(201).json(result.rows[0]);
    }
    catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Lỗi khi thêm sản phẩm" });
    }
});
exports.createProduct = createProduct;
/*----------------------------------
Update product
-----------------------------------*/
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { title, originalPrice, price, discount, tag, image, category } = req.body;
    try {
        const result = yield database_1.default.query(`UPDATE products 
         SET title=$1, originalPrice=$2, price=$3, discount=$4, tag=$5, image=$6, category=$7
       WHERE id=$8
       RETURNING *`, [title, originalPrice, price, discount, tag, image, category, id]);
        if (result.rowCount && result.rowCount > 0) {
            res.json({ message: "Cập nhật sản phẩm thành công" });
        }
        else {
            res.status(404).json({ error: "Sản phẩm không tồn tại" });
        }
    }
    catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Lỗi khi cập nhật sản phẩm" });
    }
});
exports.updateProduct = updateProduct;
/*----------------------------------
Delete product
-----------------------------------*/
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const result = yield database_1.default.query("DELETE FROM products WHERE id = $1", [id]);
        if (result.rowCount && result.rowCount > 0) {
            res.json({ message: "Xóa sản phẩm thành công" });
        }
        else {
            res.status(404).json({ error: "Sản phẩm không tồn tại" });
        }
    }
    catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Lỗi khi xóa sản phẩm" });
    }
});
exports.deleteProduct = deleteProduct;
