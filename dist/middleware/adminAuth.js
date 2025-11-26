"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adminAuth = (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "Không tìm thấy token" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your-secret-key");
        if (!decoded.userId) {
            res.status(403).json({ error: "Token không hợp lệ" });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (_b) {
        res.status(401).json({ error: "Token không hợp lệ" });
    }
};
exports.adminAuth = adminAuth;
