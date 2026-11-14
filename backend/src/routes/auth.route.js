import express from "express";

import {
  registerNewUserController,
  loginUserController,
  logoutUserController,
  getMeController,
} from "../controllers/auth.controller.js";

import { authUser } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access public
 */

authRouter.post("/register", registerNewUserController);

/**
 * @route POST /api/auth/login
 * @description Login a user using email and password
 * @access public
 */
authRouter.post("/login", loginUserController);

/**
 * @route GEt /api/auth/logout
 * @description Logout a user using token and clear the token
 * @access private
 */
authRouter.get("/logout", logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description get the current logged in user details
 * @access private
 */

authRouter.get("/get-me", authUser, getMeController);

export default authRouter;
