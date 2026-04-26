import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import tweetsRouter from "./routes/tweets";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", tweetsRouter);

app.listen(PORT, () => {
  console.log(`Twitter Scraper server running at http://localhost:${PORT}`);
});
