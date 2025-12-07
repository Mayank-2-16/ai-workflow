import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  hfApiToken: process.env.HF_API_TOKEN || "",
  mongoUri: process.env.MONGODB_URI || "",
};

if (!env.hfApiToken) {
  console.warn("⚠️ HF_API_TOKEN is not set in .env");
}

if (!env.mongoUri) {
  console.warn("⚠️ MONGODB_URI is not set in .env");
}