import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { createServer } from "node:http2";

import { corsOptions } from "@/config";
import { envConfig } from "@/config";
import { v1Router } from "@/routes";
import ApiResponse from "@/utils/api/ApiResponse";

const app = express();
const port = envConfig.port;

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", v1Router);

app.use((req: Request, res: Response) => {
  res
    .status(404)
    .json(
      new ApiResponse(
        404,
        `${req.method} route not found for ${req.url}`,
        null,
      ),
    );
});

function startServer() {
  try {
    const httpServer = createServer(app);

    httpServer.listen(port, () => {
      console.log(`Server is listening on: ${port}`);
    });
  } catch (error) {
    console.log("Error starting server", error);
  }
}

startServer();
