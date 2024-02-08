import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt, { decode } from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async (userID) => {
    try {
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //add refresh token in DB
        user.refreshToken = refreshToken
        //save it in DB
        //if we saved without any parameters then the mongoose schema that we built would come into action. It would check to ensure that all fields are valid and conform to the specific rules. We do not want that so we use validateBeforeSave which would directly push the data to the database without the mongoose model kicking in.
        await user.save({ validateBeforeSave: false })

        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    //get user details from frontend
    //validation - not empty
    //check if user already exists: check using username or email
    //check for images, check for avatar
    //upload them to cloudinary, avatar 
    //create user object - create entry in db
    //remove password and refresh token field from response.
    //check for user creation, if true return response

    //form and json data can be found in req.body
    const {fullname, email, username, password} = req.body
    console.log("This is req body: ", req)
    console.log("email: ", email)

    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required!")
    }

    const existedUser = await User.findOne({ 
        //The $or operator performs a logical OR operation on an array of one or more <expressions> and selects the documents that satisfy at least one of the <expressions>.
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists!")
    }

    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
  
    //console.log(req.files)
    //console.log(avatarLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required!")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    //check if user is actually created and remove password and refresh token fields.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user.")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler( async (req, res) => {
    //take data from req body
    //login based on username or email
    //find user in database
    //if user found password check
    //if password is correct -> generate access and refresh tokens.
    //send cookie

    const {email, username, password} = req.body
    console.log(email, username, password)

    if(!username && !email){
        throw new ApiError(400, "username or email is required!")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    //NOTE:- the custom methods that we created can be accessed by the instance of the database. (here user)
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials!")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id )
    //console.log(refreshToken)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        //the below options make it only server modifiable, the frontend can only see the cookies and not modify them. This enhances security.
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler( async(req, res) => { 
    //We do not have a username or userid through which we can access the user in the database to log it out. So we created our own middleware to access the user in the database.
    User.findByIdAndUpdate(
        //this is the user object that was added in the req object through the middleware auth.middleware.js
        req.user._id,
        {
            //updates the given fields
            $unset: {
                refreshToken: 1 //this removes the field from document.
            }
        },
        {
            //gives the new updated values
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        )
})

const refreshAccessToken = asyncHandler( async(req, res) => {
    //handling for web browser and mobile apps
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        //this decoded token gives access to the user id (check in user.models.js)
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const{accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async(req, res) => {
    //these are form values
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )
})

const getCurrentUser = asyncHandler( async(req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                req.user,
                "Current user fetched successfully"
            )
        )
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullname, email} = req.body

    if(!fullname || !email) {
        throw new ApiError(400, "All fields are required")
    }

    //updated user
    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            fullname, //ES6 syntax otherwise fullname: fullname
            email
        },
        {new: true},    //returns the information after updation
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, 
                user,
                "Account details updated successfully"
            )
        )
})

const updateUserAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar updated successfully"
            )
        )
})

const updateCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading cover image on cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover Image updated successfully"
            )
        )
})

const getUserChannelProfile = asyncHandler( async (req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullname: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User channel fetched successfully."
            )
        )
})

const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                //why did we write like this and not _id: req.user.id?
                //this is because req.user._id does not return the actual mongoDB ID, it just return a string. Mongoose is able to handle everything with this string behind the scenes. But in aggregation pipelines, mongoose does not have a role. So we have to specify the actual mongoDB ID so for that we create a new objectId for mongoDB.
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully."
            )
        )
})

export {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

/**
How asyncHandler works in registeredUser
Calling asyncHandler:
asyncHandler is a higher-order function that takes a requestHandler function as an argument.

Defining requestHandler:
The requestHandler function passed to asyncHandler is an asynchronous function, as indicated by the async keyword.

Returning the Inner Function:
asyncHandler returns an inner function that is used as middleware in an Express route handler.

Calling the Inner Function with Express Parameters:
The inner function takes the standard Express parameters: req (request), res (response), and next (next middleware function).

Promise Resolution:
Promise.resolve(requestHandler(req, res, next)) is called. This ensures that the requestHandler is treated as a promise. Since the requestHandler is asynchronous, it returns a promise.

Asynchronous Execution of registerUser:
The registerUser function is an asynchronous function. It returns a JSON response with a status of 200 and the message "ok".

Handling the Promise:
The promise returned by requestHandler is resolved. In this case, the resolution value is the JSON response from registerUser.

Sending the JSON Response:
The resolved value (JSON response) is passed to res.status(200).json({ message: "ok" }). This sets the HTTP status to 200 and sends the JSON response to the client.
Middleware Completion:

The inner function completes its execution. Since there is no explicit call to next(), Express assumes the middleware has completed successfully.
 */