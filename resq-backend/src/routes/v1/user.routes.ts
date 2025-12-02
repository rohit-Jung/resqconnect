import express from "express";

import {
  changePassword,
  forgotPassword,
  getProfile,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updatePushToken,
  updateUser,
  verifyUser,
} from "@/controllers/user.controller";
import { validateRoleAuth } from "@/middlewares/auth.middleware";

const userRouter = express.Router();
const validateUser = validateRoleAuth(["user"]);

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter
  .route("/logout")
  .get(validateRoleAuth(["admin", "user"]), logoutUser);

userRouter
  .route("/update")
  .put(validateRoleAuth(["admin", "user"]), updateUser);

userRouter.route("/verify").post(verifyUser);
userRouter.route("/forgot-password").post(forgotPassword);
userRouter.route("/reset-password").post(resetPassword);
userRouter.route("/change-password").post(validateUser, changePassword);

userRouter.route("/profile").get(validateUser, getProfile);
userRouter.post("/update-push-token", validateUser, updatePushToken);
userRouter.route("/:userId").get(getUser);

export default userRouter;
