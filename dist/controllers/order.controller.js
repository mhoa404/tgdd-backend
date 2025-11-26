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
exports.getUserOrders = exports.updateOrderStatus = exports.getAllOrders = exports.createOrder = void 0;
const database_1 = __importDefault(require("../config/database"));
/*-----------------------------------------
  Create order
-------------------------------------------*/
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { fullName, email, phone, address, productId, productTitle, productPrice, quantity = 1, paymentMethod = "cod", } = req.body;
        if (!fullName ||
            !email ||
            !phone ||
            !address ||
            !productId ||
            !productTitle ||
            !productPrice) {
            res.status(400).json({ error: "Thiếu thông tin đơn hàng" });
            return;
        }
        const totalAmount = productPrice * quantity;
        /*-----------------------------------------
          THANH TOÁN BẰNG VÍ
        -------------------------------------------*/
        if (paymentMethod === "wallet") {
            const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
            if (!token) {
                res.status(401).json({ error: "Cần đăng nhập để thanh toán bằng ví" });
                return;
            }
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
            const userId = decoded.userId;
            /* Kiểm tra số dư ví */
            const walletResult = yield database_1.default.query("SELECT balance FROM wallets WHERE user_id = $1", [userId]);
            const wallet = walletResult.rows[0];
            if (!wallet || wallet.balance < totalAmount) {
                res.status(400).json({ error: "Số dư ví không đủ" });
                return;
            }
            /* Transaction PostgreSQL */
            const client = yield database_1.default.connect();
            try {
                yield client.query("BEGIN");
                /* Tạo đơn hàng */
                yield client.query(`INSERT INTO orders 
            (full_name, email, phone, address, product_id, product_title, product_price, status, payment_method) 
           VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed','wallet')`, [
                    fullName,
                    email,
                    phone,
                    address,
                    productId,
                    productTitle,
                    productPrice,
                ]);
                /* Trừ ví */
                yield client.query("UPDATE wallets SET balance = balance - $1 WHERE user_id = $2", [totalAmount, userId]);
                /* Lịch sử giao dịch ví */
                yield client.query(`INSERT INTO wallet_transactions (wallet_id, type, amount, description) 
           VALUES (
             (SELECT id FROM wallets WHERE user_id = $1),
             'payment',
             $2,
             $3
           )`, [userId, totalAmount, `Thanh toán đơn hàng: ${productTitle}`]);
                yield client.query("COMMIT");
                res.status(200).json({
                    message: "Đặt hàng & thanh toán thành công",
                    paymentMethod: "wallet",
                });
            }
            catch (error) {
                yield client.query("ROLLBACK");
                throw error;
            }
            finally {
                client.release();
            }
            return;
        }
        /*-----------------------------------------
          COD – Thanh toán khi nhận hàng
        -------------------------------------------*/
        yield database_1.default.query(`INSERT INTO orders 
        (full_name, email, phone, address, product_id, product_title, product_price, status, payment_method)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','cod')`, [fullName, email, phone, address, productId, productTitle, productPrice]);
        res.status(200).json({
            message: "Đặt hàng thành công",
            paymentMethod: "cod",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
});
exports.createOrder = createOrder;
/*-----------------------------------------
  Get all orders
-------------------------------------------*/
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query("SELECT * FROM orders ORDER BY created_at DESC");
        res.json(result.rows);
    }
    catch (error) {
        console.error("Lỗi lấy đơn hàng:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});
exports.getAllOrders = getAllOrders;
/*-----------------------------------------
  Update order status
-------------------------------------------*/
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield database_1.default.query("SELECT id, email, product_title FROM orders WHERE id = $1", [id]);
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
        yield database_1.default.query("UPDATE orders SET status = $1 WHERE id = $2", [
            status,
            id,
        ]);
        /* Gửi notification */
        yield database_1.default.query(`INSERT INTO notifications (user_email, title, message, is_read)
       VALUES ($1,$2,$3,FALSE)`, [
            order.email,
            `Cập nhật đơn hàng: ${order.product_title}`,
            `Đơn hàng của bạn đã được chuyển sang trạng thái: ${status}`,
        ]);
        res.json({
            success: true,
            message: "Cập nhật thành công",
            order: Object.assign(Object.assign({}, order), { status }),
        });
    }
    catch (error) {
        console.error("Lỗi cập nhật đơn hàng:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});
exports.updateOrderStatus = updateOrderStatus;
/*-----------------------------------------
  Get order by user email
-------------------------------------------*/
const getUserOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const result = yield database_1.default.query("SELECT * FROM orders WHERE email = $1 ORDER BY created_at DESC", [email]);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error("Lỗi lấy đơn hàng user:", error);
        res.status(500).json({ error: "Lỗi server" });
    }
});
exports.getUserOrders = getUserOrders;
