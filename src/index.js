import dotenv from "dotenv";
import app from "./app.js";
dotenv.config({ path: "./.env" });

import connectToDatabase from "./db/database_connection.js";

connectToDatabase()
  .then(() => {
    app.on("error", (error) => {
      console.log(`Error: ${error}`);
    });
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server is running on port ", process.env.PORT || 5000);
    });
  })
  .catch((error) => {
    console.log("Error in Databae MongoDB connection", error);
    process.exit(1);
  });
