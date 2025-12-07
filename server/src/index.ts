import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { connectToDatabase } from "./config/db";
import llmRoutes from "./routes/llm";
import summarizeRoutes from "./routes/summarize";
import workflowRoutes from "./routes/workflows";

async function startServer() {
  await connectToDatabase();

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Server is running 🚀");
  });

  app.use("/api", llmRoutes);
  app.use("/api", summarizeRoutes);
  app.use("/api", workflowRoutes);

  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});