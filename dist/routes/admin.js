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
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const adminAuth_1 = require("../middleware/adminAuth");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
/*--------------------------------------
 Lấy danh sách yêu cầu nạp tiền
---------------------------------------*/
router.get("/deposits", adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query(`SELECT dr.*, u.email AS user_email
       FROM deposit_requests dr
       JOIN users u ON dr.user_id = u.id
       ORDER BY dr.created_at DESC`);
        res.json(result.rows);
    }
    catch (error) {
        console.error("Lỗi lấy danh sách nạp tiền:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
}));
/*--------------------------------------
 Duyệt yêu cầu nạp tiền
---------------------------------------*/
router.put("/deposits/:id/approve", adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Lấy bản ghi deposit
        const depositResult = yield database_1.default.query(`SELECT * FROM deposit_requests 
         WHERE id = $1 AND status = 'pending'`, [id]);
        if (depositResult.rows.length === 0) {
            res.status(404).json({
                error: "Không tìm thấy yêu cầu hoặc đã được xử lý",
            });
            return;
        }
        const deposit = depositResult.rows[0];
        // BẮT ĐẦU TRANSACTION
        const client = yield database_1.default.connect();
        try {
            yield client.query("BEGIN");
            // Cập nhật trạng thái deposit → approved
            yield client.query(`UPDATE deposit_requests 
           SET status = 'approved'
           WHERE id = $1`, [id]);
            // Tạo ví nếu chưa có
            yield client.query(`INSERT INTO wallets (user_id, balance)
           VALUES ($1, 0)
           ON CONFLICT (user_id) DO NOTHING`, [deposit.user_id]);
            // Cộng tiền vào ví
            yield client.query(`UPDATE wallets 
           SET balance = balance + $1 
           WHERE user_id = $2`, [deposit.amount, deposit.user_id]);
            yield client.query("COMMIT");
            console.log(`Đã duyệt nạp tiền: User ${deposit.user_id}, Amount: ${deposit.amount}`);
            res.json({ success: true });
        }
        catch (err) {
            yield client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
    catch (error) {
        console.error("Lỗi duyệt yêu cầu:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
}));
/*--------------------------------------
 Từ chối yêu cầu nạp tiền
---------------------------------------*/
router.put("/deposits/:id/reject", adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield database_1.default.query(`UPDATE deposit_requests 
         SET status = 'rejected' 
         WHERE id = $1`, [id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Lỗi từ chối yêu cầu:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
}));
/*--------------------------------------
 User management
---------------------------------------*/
router.get("/users", adminAuth_1.adminAuth, user_controller_1.getAllUsers);
router.get("/users/:id", adminAuth_1.adminAuth, user_controller_1.getUserById);
router.post("/users", adminAuth_1.adminAuth, user_controller_1.createUser);
router.put("/users/:id", adminAuth_1.adminAuth, user_controller_1.updateUser);
router.delete("/users/:id", adminAuth_1.adminAuth, user_controller_1.deleteUser);
exports.default = router;
