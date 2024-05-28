import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectToDatabase = async () => {
  try {
    console.log(process.env.MONGODB_URI);
   const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to database",connectionInstance.connection.host);
  } catch (error) {
    console.log("Error in Databae MongoDB connection",error);
    process.exit(1);
  }
} 

export default connectToDatabase;