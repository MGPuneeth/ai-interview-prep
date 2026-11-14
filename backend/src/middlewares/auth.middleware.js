import jwt from "jsonwebtoken";
import { blacklistTokenModel } from "../models/blacklistToken.model.js";

async function authUser(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({
      message: "Token not found",
    });
  }

  const isTokenBlacklisted = await blacklistTokenModel.findOne({ token });

  if (isTokenBlacklisted) {
    return res.status(404).json({ message: "Token is invalid" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Invalid Token",
    });
  }
}

export { authUser };
