import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser for JSON with large payload support (for base64 images)
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Server-side Gemini AI Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Route: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Route: OCR & Trade Slip Image Extraction
app.post("/api/ocr-trade", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment.",
      });
    }

    // Clean base64 string if it contains data prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    const prompt = `你是一位专业的中国A股基金/ETF及证券交易交割单、对账单、委托成交明细图片识别专家。
请仔细分析这张交易记录截图（可能是同花顺、华泰证券、东方财富、招商证券、支付宝基金、银河证券、国泰君安等证券交易软件或手机截图）。
提取图片中的每一笔交易记录，输出结构化数组。

请提取以下字段：
1. fundCode: 6位数字基金/ETF或股票代码（如 510300, 159915, 513100, 000300 等）。如果截图未写代码但有名字，可推断代码；若无法推断填空字符串。
2. fundName: 基金或ETF名称（如 沪深300ETF, 纳指ETF, 白酒LOF, 创业板ETF等）。
3. type: 交易类型，必须是 'BUY' (买入/申购/做T买入), 'SELL' (卖出/赎回/做T卖出), 或 'DIVIDEND' (分红)。
4. price: 成交均价/单价（数值，精确到小数，如 3.842）。
5. quantity: 成交数量/份额（数值，如 1000）。
6. fee: 交易手续费/佣金/印花税等费用（数值，若图片没标明通常可预估或写0）。
7. date: 交易发生日期（格式：YYYY-MM-DD，如果图片只有月份和日期如 08-15，请结合今年年份补充完整，如 2026-08-15 或截图年份）。
8. time: 交易时间（格式：HH:mm:ss 或 HH:mm，没有则写空字符串）。
9. notes: 备注信息（如 "证券App截图识别"、成交编号、分批成交说明等）。

如果图片是成对做T记录，请将每一笔成交（买入、卖出）分别作为独立项输出。
确保识别准确，数字正确。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            records: {
              type: Type.ARRAY,
              description: "识别出的交易明细列表",
              items: {
                type: Type.OBJECT,
                properties: {
                  fundCode: { type: Type.STRING, description: "基金/ETF代码" },
                  fundName: { type: Type.STRING, description: "基金/ETF名称" },
                  type: {
                    type: Type.STRING,
                    description: "交易类型: BUY 或 SELL 或 DIVIDEND",
                  },
                  price: { type: Type.NUMBER, description: "成交单价" },
                  quantity: { type: Type.NUMBER, description: "成交数量/份额" },
                  fee: { type: Type.NUMBER, description: "手续费/佣金" },
                  date: { type: Type.STRING, description: "交易日期 YYYY-MM-DD" },
                  time: { type: Type.STRING, description: "交易时间 HH:mm:ss" },
                  notes: { type: Type.STRING, description: "备注说明" },
                },
                required: ["fundCode", "fundName", "type", "price", "quantity", "date"],
              },
            },
            summary: {
              type: Type.STRING,
              description: "对本次识别内容的简要文字摘要（如识别出几笔成交、涉及哪些标的）",
            },
          },
          required: ["records"],
        },
      },
    });

    const responseText = response.text || "{}";
    const result = JSON.parse(responseText);

    return res.json({
      success: true,
      records: result.records || [],
      summary: result.summary || `成功识别出 ${(result.records || []).length} 笔交易记录`,
    });
  } catch (error: any) {
    console.error("Gemini Trade OCR Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "图像识别交易单失败，请重试或手动录入",
    });
  }
});

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Grid & T-Trade Journal Server running on http://localhost:${PORT}`);
  });
}

startServer();
