import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  RefreshAccessToken,
  updateProfile,
  changePassword,
  getCurrentUser,
  UpdateAvatarOrCover,
  channelinfo,
  watchhistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { varifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(upload.none(), loginUser);
router.route("/profile").get(varifyJWT, getCurrentUser);
router.route("/profile").put(varifyJWT, updateProfile);
router.route("/change-password").put(varifyJWT, changePassword);
router.route("/update-avatar-cover").put(
  varifyJWT,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  UpdateAvatarOrCover
);
router.route("/channelinfo").get(channelinfo);
router.route("/watchhistory").get(watchhistory);  

//secure routes

router.route("/logout").post(varifyJWT, logoutUser);
router.route("/refresh").post(RefreshAccessToken);


export default router;
