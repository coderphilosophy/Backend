import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweets.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //STEPS: 
    //get content from req.body
    //check if content is null
    //get the user id with req.body
    //create a document in mongo db.
    //check if tweet actually created
    //return response
    //console.log(req.body)

    //console.log(req);
    console.log(req.body);
    const {content} = req.body
    //const content = req.body.content
    console.log(content)
    //const {content} = req.body;

    const owner = req.user._id;    //custom middleware verifies the user and get user details
    console.log(owner)
    if(!content){
        throw new ApiError(400, "Cannot make an empty tweet.")
    }

    const tweet_document = await Tweet.create({
        owner,
        content,
    })
    console.log(tweet_document);

    const tweet = await Tweet.findById(tweet_document._id)
    console.log(tweet)

    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating the tweet.")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweet,
                "Tweet created successfully"
            )
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    console.log(userId)
    if(!userId){
        new ApiError(404, "User not found");
    }

    const userTweets = await Tweet.find({owner : userId})
    console.log(userTweets)

    if(!userTweets){
        new ApiError(404, "Could not fetch user tweets.")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userTweets,
                "User tweets fetched successfully."
            )
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    const {content} = req.body

    if(!content){
        throw new ApiError(404, "Please make some changes.")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            }
        },
        {new : true}
    )

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                updateTweet,
                "Tweet updated successfully."
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if(!tweetId){
        new ApiError(404, "Tweet not found!")
    }

    const deletedTweet = await Tweet.deleteOne({_id: tweetId});

    if(!deleteTweet){
        new ApiError(400, "Tweet not found.")
    }

    return res 
        .status(200)
        .json(
            new ApiResponse(
                200,
                deleteTweet,
                "Tweet deleted successfully."
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}