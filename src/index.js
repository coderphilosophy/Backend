//require('dotenv').config({path: './env'})     commonJS method
import dotenv from 'dotenv'

import connectDB from './db/index.js'

dotenv.config({
    path: './env'
})

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("ERR: ", error);
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port ${process.env.PORT}`)
        })
    })
    .catch((error) => {
        console.log("MONGO DB connection failed !!!", error)
    })


//This is one of the approach through which we can connect the database.

// import mongoose from 'mongoose'
// import { DB_NAME } from './constants'
// import express from 'express'
// const app = express()

// ( async () => {
//     try{
//         const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         console.log(`MongoDB connected !! DB HOST ${connectionInstance}`)
//         app.on("error", (error) => {
//             console.log("ERROR: Application not able to talk to the database")
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })
//     } catch(error){
//         console.log("ERROR: ", error)
//         throw error
//     }
// })()

