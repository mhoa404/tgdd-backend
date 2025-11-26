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
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("../config/database"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
function chatHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { prompt } = req.body;
            /*----------------------------------
                Kiểm tra xem có phải câu hỏi sản phẩm hay không
            -----------------------------------*/
            const isProductQuery = prompt.toLowerCase().includes("có") &&
                (prompt.toLowerCase().includes("không") || prompt.toLowerCase().includes("ko"));
            if (isProductQuery) {
                const keywords = prompt
                    .toLowerCase()
                    .replace(/có|không|ko|cái|những|các|sản phẩm|hay|là|nào|gì|thế|như|vậy/g, "")
                    .trim()
                    .split(" ")
                    .filter((w) => w.length > 2);
                if (keywords.length > 0) {
                    /*----------------------------------
                        PostgreSQL dynamic placeholder
                    -----------------------------------*/
                    const searchQuery = keywords
                        .map((_, i) => `LOWER(title) LIKE LOWER($${i + 1})`)
                        .join(" OR ");
                    const searchParams = keywords.map((kw) => `%${kw}%`);
                    const result = yield database_1.default.query(`SELECT * FROM products WHERE ${searchQuery} ORDER BY title`, searchParams);
                    const products = result.rows;
                    if (products.length > 0) {
                        let response = "Có, chúng tôi có các sản phẩm sau:\n\n";
                        products.forEach((product, index) => {
                            response += `${index + 1}. ${product.title}\n`;
                            response += `   - Giá gốc: ${product.originalprice}đ\n`;
                            response += `   - Giá khuyến mãi: ${product.price}đ\n`;
                            response += `   - Giảm giá: ${product.discount}%\n`;
                            if (product.tag)
                                response += `   - Tag: ${product.tag}\n`;
                            response += "\n";
                        });
                        res.json({ text: response });
                        return;
                    }
                    else {
                        res.json({
                            text: `Xin lỗi, hiện tại chúng tôi không có sản phẩm "${keywords.join(" ")}" trong kho.`,
                        });
                        return;
                    }
                }
            }
            /*----------------------------------
                Nếu không phải câu hỏi sản phẩm → trả về Gemini AI
            -----------------------------------*/
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
            });
            const result = yield model.generateContent(prompt);
            const response = yield result.response;
            res.json({ text: response.text() });
        }
        catch (error) {
            console.error("Chatbot error:", error);
            if (typeof error === "object" &&
                error !== null &&
                "status" in error &&
                error.status === 429) {
                res.status(429).json({
                    error: "Hiện tại hệ thống đang quá tải, vui lòng thử lại sau vài phút.",
                });
                return;
            }
            res.status(500).json({
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
}
router.post("/chat", chatHandler);
exports.default = router;
