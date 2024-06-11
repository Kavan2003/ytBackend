import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Joi from "joi";
import { User } from "../models/user.models.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { statusCodes } from "../constants.js";

const generateRefreshTokenAndAccessToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    if (!user) {
      throw new ApiError(
        statusCodes.NOT_FOUND,
        "User not found while generating tokens"
      );
    }
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    console.log("Error in generating tokens ", error);
    throw new ApiError(
      statusCodes.INTERNAL_SERVER_ERROR,
      "Error in generating tokens ",
      error.message
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password, bio, websites } = req.body;

  const avatarlocalfile = req.files?.avatar[0]?.path;

  var coverlocalfile;
  if (req.files?.cover) {
    coverlocalfile = req.files?.cover[0]?.path;
  } else {
    coverlocalfile = "";
  }

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

  const { error } = schema.validate(
    { username, email, fullName, password, bio, websites, avatarlocalfile },
    { abortEarly: false }
  );

  if (error) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      error.details.map((detail) => detail.message)
    );
  } else {
    const extingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (extingUser) {
      console.log("User already exists");
      throw new ApiError(
        statusCodes.Already_Exists,
        "Username or email already exists"
      );
    }

    const avatarurl = await uploadFileOnCloudinary(avatarlocalfile);
    console.log("avatarurl=", avatarurl);
    let coverurl;
    if (coverlocalfile !== "") {
      coverurl = await uploadFileOnCloudinary(coverlocalfile);
      console.log("coverurl=", coverurl);
    }

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
      throw new ApiError(
        statusCodes.INTERNAL_SERVER_ERROR,
        "Error in creating user"
      );
    }
    console.log("User registered successfully");

    // return res.send(new ApiResponse(201, "User registered successfully", createdUser));
    return res
      .status(statusCodes.CREATED)
      .json(new ApiResponse(201, "User registered successfully", createdUser));
  }
});
const loginUser = asyncHandler(async (req, res) => {
  //  take data from user req.body
  // validate the data using Email/Username and password
  // if user exists, generate token and send it to user
  // if user does not exist, send error message
  // do refresh token logic
  // send response to user and cookie

  const { email, username, password } = req.body;
  // if(!email && !username){
  //   throw new ApiError(statusCodes.BAD_REQUEST, "Email or username is required");
  // }
  const Schema = Joi.object({
    email: Joi.string().email().messages({
      "string.email": "Invalid email format",
    }),
    username: Joi.string().messages({
      "string.base": "Invalid username format",
    }),
    password: Joi.string().required().min(6).messages({
      "any.required": "Password is required",

      "string.min": "Password should be at least 6 characters",
    }),
  })
    .or("email", "username")
    .messages({
      "object.missing": "Either Email or username is required",
    });
  const { error } = Schema.validate(
    { email, username, password },
    { abortEarly: false }
  );
  if (error) {
    // console.log("error", error);
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      error.details.map((detail) => detail.message)
    );
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, "User not found");
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(statusCodes.UNAUTHORIZED, "Invalid credentials");
  }
  const { refreshToken, accessToken } =
    await generateRefreshTokenAndAccessToken(user._id);

  const loggedUser = await User.findById(user._id).select("-password -refreshToken");

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(statusCodes.OK)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(statusCodes.OK, "Success", {
        loggedUser,
        accessToken,
        refreshToken,
      })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { refreshToken: undefined },
    { new: true }
  );
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(statusCodes.OK)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(statusCodes.OK, "Logged out successfully", {}));
});

const RefreshAccessToken = asyncHandler(async (req, res) => {
  const { incommingRefreshToken } = req.cookies?.refreshToken||req.headers.authorization.replace("Bearer ", "");
  if (!incommingRefreshToken) {
    throw new ApiError(statusCodes.BAD_REQUEST, "Refresh token is required");
  }
  const decodeToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN);
  const user = await User.findById(decodeToken.id);
  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, "User not found");
  }

  const { refreshToken, accessToken } = await generateRefreshTokenAndAccessToken();
  res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, "Success", { refreshToken, accessToken}));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { username,  fullName, bio, websites } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, "User not found");
  }

  user.username = username || user.username;
  user.fullName = fullName || user.fullName;
  user.bio = bio || user.bio;
  user.websites = websites || user.websites;

  await user.save({ validateBeforeSave: false});

  res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, "Profile updated successfully", user));
});
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, "User not found");
  }
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new ApiError(statusCodes.UNAUTHORIZED, "Invalid Old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, "Password changed successfully",{}));



});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, "Success", req.user));
});

const UpdateAvatarOrCover = asyncHandler(async (req, res) => {
  // const localflieAvatar = req.files?.avatar[0]?.path;

  
  var Avatarlocalfile;
  if (req.files?.avatar) {
    Avatarlocalfile = req.files?.avatar[0]?.path;
  } else {
    Avatarlocalfile = "";
  }

  
  var coverlocalfile;
  if (req.files?.cover) {
    coverlocalfile = req.files?.cover[0]?.path;
  } else {
    coverlocalfile = "";
  }

if(Avatarlocalfile){
  const avatarurl = await uploadFileOnCloudinary(Avatarlocalfile);
  console.log("avatarurl=", avatarurl);
}
if(coverlocalfile){
  const coverurl = await uploadFileOnCloudinary(coverlocalfile);
  console.log("coverurl=", coverurl);
}
  
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(statusCodes.NOT_FOUND, "User not found");
    }
    user.avatar = avatarurl?.url || user.avatar;
    user.coverImage = coverurl?.url || user.coverImage;
    await user.save({ validateBeforeSave: false });
    res.status(statusCodes.OK).json(new ApiResponse(statusCodes.OK, "Profile  updated successfully", user));

});


export { registerUser, loginUser, logoutUser, RefreshAccessToken,updateProfile,changePassword,getCurrentUser,UpdateAvatarOrCover };
