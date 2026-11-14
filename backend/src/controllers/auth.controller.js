import { userModel } from "../models/user.model.js";
import { blacklistTokenModel } from "../models/blacklistToken.model.js";

import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

/**
 * @name registerNewUserController
 * @description registetr a new user, expects username, emailand password in the request
 * @access Public
 */

async function registerNewUserController(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Please provide username, email and password",
    });
  }

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlreadyExists) {
    if (isUserAlreadyExists.username === username) {
      return res.status(400).json({
        message: "Username in already in use",
      });
    } else {
      return res.status(400).json({
        message: "Email in already in use",
      });
    }
  }
  const hashPass = await bcrypt.hash(password, 12);

  const user = await userModel.create({
    username,
    email,
    password: hashPass,
  });

  const jwtToken = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", jwtToken);

  return res.status(200).json({
    message: "User created successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

/**
 * @name loginUserController
 * @description login user, expects email and password in the request
 * @access Public
 */

async function loginUserController(req, res) {
  const { email, password } = await req.body;
  // console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({
      message: "Please provide email and password",
    });
  }

  const user = await userModel.findOne({
    email,
  });

  if (!user) {
    return res.status(400).json({
      message: "User not registered",
    });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(400).json({
      message: "Incorrect password, Please Try again",
    });
  }

  const isTokenPresent = req.cookies?.token;

  // console.log(isTokenPresent);l

  if (isTokenPresent) {
    return res.status(400).json({
      message: "User already logged in",
    });
  }

  const jwtToken = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  res.cookie("token", jwtToken);

  return res.status(200).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}

/**
 * @name logoutUserController
 * @description logout user, expects email and password in the request
 * @access Public
 */

async function logoutUserController(req, res) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({
      message: "Token does not exist ",
    });
  }

  await blacklistTokenModel.create({
    token,
  });

  res.clearCookie("token");
  return res.status(200).json({
    message: "User logged out successfully",
  });
}

async function getMeController(req, res) {
  const user = await userModel.findById(req.user.id);

  res.status(200).json({
    message: "User details fetched successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
}
export {
  registerNewUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};
