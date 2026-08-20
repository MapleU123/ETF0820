import { GoogleGenAI } from "@google/genai";

interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export const handler = async (): Promise<HandlerResponse> => {
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "Netlify Function Health",
    }),
  };
};
