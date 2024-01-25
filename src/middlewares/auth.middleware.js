//main function is to verify if the user is there or not.

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler( async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        //console.log(token)

        if(!token){
            throw new ApiError(401, "Unauthorized request!")
        }
    
        //verify the token by decoding with the secret key with which it was encoded.
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid access token")
        }
    
        //adding a new object to req 
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})

/**
 NOTES:-

 req.header("Authorization")?.replace("Bearer ", "")
 This is done for mobile applications. Mobile applications do not use cookies as they use native storage methods provided by the operating system or the development framework. 
 Web browsers on the other hand use cookies for maintaining user sessions. This is because HTTP being a stateless protocol which means the request between client and server is independent and not aware of the previous request.

 So the mobile applications sent the data in the form of the headers
 Authentication: Bearer <token>
 */