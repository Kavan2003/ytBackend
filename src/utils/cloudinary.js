import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
console.log("Cloudinary is connecting", process.env.CLOUDINARY_API_KEY); 
cloudinary.config(
  {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
);
console.log("Cloudinary is connected", process.env.CLOUDINARY_CLOUD_NAME);

const uploadFileOnCloudinary = async (localFliePath) => {
  try {
    if (!localFliePath) {
      throw new Error("File path is required");
    } else {
      const response = await cloudinary.uploader.upload(localFliePath, {
        resource_type: "auto",
      });
      // console.log("File is Upload on Cloudinary url=",response.url);
      fs.unlinkSync(localFliePath); //delete file from local storage
      return response;
    }
  } catch (error) {
    console.error("Error in uploadFileOnCloudinary", error);

    fs.unlinkSync(localFliePath); //delete file from local storage
    return null;
  }
};

export { uploadFileOnCloudinary };
