import { Router } from "express";
import userRouter from "@/routes/v1/user.routes";
import healthCheckRouter from "@/routes/healthcheck.routes";

const v1Router = Router();

v1Router.use("/healthcheck", healthCheckRouter);
v1Router.use("/user", userRouter);

export { v1Router };
