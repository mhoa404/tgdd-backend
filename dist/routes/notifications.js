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
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../config/database"));
const router = express_1.default.Router();
/*----------------------------------
Lấy thông báo theo email
-----------------------------------*/
router.get('/:email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query(`SELECT * 
       FROM notifications 
       WHERE user_email = $1 
       ORDER BY created_at DESC 
       LIMIT 50`, [req.params.email]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Lỗi lấy thông báo:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
}));
/*----------------------------------
Đánh dấu thông báo đã đọc
-----------------------------------*/
router.put('/:id/read', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.query(`UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1`, [req.params.id]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Lỗi cập nhật thông báo:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
}));
exports.default = router;
