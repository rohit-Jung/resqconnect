import ApiResponse from "@/utils/api/ApiResponse";
import type { Request, Response } from "express"

export const notFoundMiddleware = ((req: Request, res: Response) => {
  res
    .status(404)
    .json(
      new ApiResponse(404, `${req.method} route not found for ${req.url}`, null)
    );
})
