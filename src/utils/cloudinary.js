import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: process.env.CLOUDNARY_cloud_name,
  api_key: process.env.CLOUDNARY_api_key,
  api_secret: process.env.CLOUDNARY_api_secret,
});

const uploadFileOnCloudinary = async (localFliePath) => {
  try {
    if (!localFliePath) {
      throw new Error("File path is required");

    } else {
      const response = await cloudinary.uploader.upload(
        localFliePath,
        { folder: "video-uploads" },
        { resourse_type: "video" },
      );
      console.log("File is Upload on Cloudinary url=",response.url);
      return response;
    }
  } catch (error) {
    console.error("Error in uploadFileOnCloudinary", error);
    fs.unlinkSync(localFliePath);//delete file from local storage
    return null;
  }
};


export { uploadFileOnCloudinary };