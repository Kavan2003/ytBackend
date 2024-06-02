import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Joi from "joi";
import { User } from "../models/user.models.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const schema = Joi.object({
  username: Joi.string().required().messages({
    "any.required": "Username is required",
  }),
  email: Joi.string().email().required().messages({
    "any.required": "Email is required",
    "string.email": "Invalid email format",
  }),
  fullName: Joi.string().required().messages({
    "any.required": "Full name is required",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Password is required",
    "string.min": "Password should be at least 6 characters",
  }),
  bio: Joi.string().max(100).messages({
    "string.max": "Bio should not exceed 100 characters",
  }),
  websites: Joi.array().items(Joi.string().uri()).messages({
    "array.base": "Websites should be an array",
    "string.uri": "Invalid website URL format",
  }),
  avatarlocalfile: Joi.string().required().messages({
    "any.required": "Avatar is required",
  }),
});

const registerUser = asyncHandler(async (req, res) => {


  const { username, email, fullName, password, bio, websites } = req.body;
  const avatarlocalfile = req.files?.avatar[0]?.path;

  // console.log("req", req.body);
  var coverlocalfile;
  if (req.files?.cover) {
    coverlocalfile = req.files?.cover[0]?.path;
  } else {
    coverlocalfile = "";
  }

  const { error } = schema.validate(
    { username, email, fullName, password, bio, websites, avatarlocalfile },
    { abortEarly: false }
  );

  if (error) {
    throw new ApiError(
      400,
      error.details.map((detail) => detail.message)
    );
  } else {
    const extingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (extingUser) {
      console.log("User already exists");
      throw new ApiError(409, "Username or email already exists");
    }

    const avatarurl = await uploadFileOnCloudinary(avatarlocalfile);
    console.log("avatarurl=", avatarurl);

    const coverurl = await uploadFileOnCloudinary(coverlocalfile);
    console.log("coverurl=", coverurl);

    const user = await User.create({
      username: username.toLowerCase(),
      email,
      fullName,
      password,
      bio,
      websites,
      avatar: avatarurl.url,
      coverImage: coverurl?.url || "",
    });

    const createdUser = await User.findOne(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Error in creating user");
    }
    console.log("User registered successfully");

    // return res.send(new ApiResponse(201, "User registered successfully", createdUser));
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
           "User registered successfully",
           createdUser
        )
      );
  }
});

export { registerUser };
