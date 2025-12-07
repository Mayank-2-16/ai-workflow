import mongoose from "mongoose";
import { env } from "./env";

export async function connectToDatabase() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}
