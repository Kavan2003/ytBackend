import mongoose from "mongoose";
import { model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    avatar: {
      type: String,
      required: [true, "Avatar is required"],
    },
    coverImage: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    bio: {
      type: String,
    },
    websites: {
      type: [String],
    },
    refreshToken: {
      type: String,
    },
    watchHistory: {
      type: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, fullName: this.fullName, bio: this.bio },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
    
  );
};
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id},
        process.env.REFRESH_TOKEN,
        {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
        }
    );
    }

export const User = model("User", userSchema);
