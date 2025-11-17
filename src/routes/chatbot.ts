import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();
const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ChatRequest extends Request {
    body: {
        prompt: string;
    };
}

async function chatHandler(req: ChatRequest, res: Response): Promise<void> {
    try {
        const { prompt } = req.body;

        /*----------------------------------
            Kiểm tra xem có phải câu hỏi sản phẩm hay không
        -----------------------------------*/
        const isProductQuery =
            prompt.toLowerCase().includes("có") &&
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

                const result = await pool.query(
                    `SELECT * FROM products WHERE ${searchQuery} ORDER BY title`,
                    searchParams
                );

                const products = result.rows;

                if (products.length > 0) {
                    let response = "Có, chúng tôi có các sản phẩm sau:\n\n";

                    products.forEach((product: any, index: number) => {
                        response += `${index + 1}. ${product.title}\n`;
                        response += `   - Giá gốc: ${product.originalprice}đ\n`;
                        response += `   - Giá khuyến mãi: ${product.price}đ\n`;
                        response += `   - Giảm giá: ${product.discount}%\n`;
                        if (product.tag) response += `   - Tag: ${product.tag}\n`;
                        response += "\n";
                    });

                    res.json({ text: response });
                    return;
                } else {
                    res.json({
                        text: `Xin lỗi, hiện tại chúng tôi không có sản phẩm "${keywords.join(
                            " "
                        )}" trong kho.`,
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

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ text: response.text() });
    } catch (error) {
        console.error("Chatbot error:", error);

        if (
            typeof error === "object" &&
            error !== null &&
            "status" in error &&
            (error as any).status === 429
        ) {
            res.status(429).json({
                error: "Hiện tại hệ thống đang quá tải, vui lòng thử lại sau vài phút.",
            });
            return;
        }

        res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

router.post("/chat", chatHandler);

export default router;
