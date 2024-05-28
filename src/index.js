// require('dotenv').config({path: '.env'})
import dotenv from 'dotenv';
dotenv.config();

import connectToDatabase from "./db/database_connection.js";

connectToDatabase();
    








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