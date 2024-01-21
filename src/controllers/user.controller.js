import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export {registerUser}

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