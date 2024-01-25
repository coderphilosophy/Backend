import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt, { decode } from "jsonwebtoken";

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
    //console.log("This is req body: ", req.body)
    //console.log("email: ", email)

    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required!m ")
    }

    const existedUser = await User.findOne({ 
        //The $or operator performs a logical OR operation on an array of one or more <expressions> and selects the documents that satisfy at least one of the <expressions>.
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists!")
    }

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
            $set: {
                refreshToken: undefined
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

export {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken
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