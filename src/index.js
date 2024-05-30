// require('dotenv').config({path: '.env'})
import dotenv from "dotenv";
import app from "./app.js";
dotenv.config();

import connectToDatabase from "./db/database_connection.js";

connectToDatabase()
  .then(() => {
    app.on("error",(error)=>{   
        console.log(`Error: ${error}`)
    })
    app.listen(process.env.PORT||5000, () => {
        console.log("Server is running on port 5000");
        });
  })
  .catch((error) => {
    console.log("Error in Databae MongoDB connection", error);
    process.exit(1);
  });

// import express from "express";
// const app =  express();
// (async()=>{
//     try {
//       await  mongoose.connect(  `${process.env.MONGODB_URI}/${DB_NAME}`, )
//       app.on('error',(error)=>{
//         console.log(`Error: ${error}`)
//     })
//       app.on('listening',()=>{
//           console.log('Server is running on port 5000')
//       })

//     } catch (error) {
//         console.log(error)
//     }
// })()
