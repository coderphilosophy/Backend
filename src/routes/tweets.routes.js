import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweets.controller.js"

import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

//we need the apply the verifyJWT middleware to all the tweet routes to get the user.
router.use(verifyJWT); 

router.route("/create").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router