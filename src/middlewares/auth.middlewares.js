import  jwt  from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { statusCodes } from "../constants.js";

export const varifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "");
      console.log(token);
    if (!token) {
      throw new ApiError(statusCodes.UNAUTHORIZED, "Token is required");
    }

    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodeToken.id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(statusCodes.UNAUTHORIZED, "Invalid token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      statusCodes.UNAUTHORIZED,
      error?.message || "Invalid token"
    );
  }
});
