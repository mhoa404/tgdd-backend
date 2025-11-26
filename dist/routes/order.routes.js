"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const order_controller_1 = require("../controllers/order.controller");
const adminAuth_1 = require("../middleware/adminAuth");
const auth_1 = require("../types/auth");
const router = express_1.default.Router();
router.post("/", order_controller_1.createOrder);
router.get("/", adminAuth_1.adminAuth, order_controller_1.getAllOrders);
router.put("/:id", adminAuth_1.adminAuth, order_controller_1.updateOrderStatus);
router.get("/user/:email", auth_1.auth, order_controller_1.getUserOrders);
exports.default = router;
