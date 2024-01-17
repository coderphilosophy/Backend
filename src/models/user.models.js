import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,   //cloudinary url
            required: true,
        },
        converImage: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required!']
        },
        refreshToken: {
            type: String
        }
    }, {timestamps: true}
)

//encrypt the password
//ARROW FUNCTION SHOULD NOT BE USED AS THEY DO NOT HAVE ACCESS TO THE 'this' KEYWORD.
userSchema.pre("save", async function(next){
    //checks if the password field is modified, if not if exit early by calling the next function to prevent unecessary password hashing.
    if(!this.isModified("password")) return next()    

    this.password = await bcrypt.hash(this.password, 10)

    //next indicates that the current middleware has successfully completed all its task and Mongoose can proceed with the next middleware or the actual save operation (in this case).
    next()
})

//custom method to check if password is correct. First parameter is the user password and the second one is the encrypted password that has been stored.
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)

/*
NOTES:-
_id is mongodb syntax for IDs

JWT is a bearer token, ye token jiske paas hai usko data bhejenge. Ek chaabi ki tarah hai.



ACCESS AND REFRESH TOKENS
Access tokens and refresh tokens are components of token-based authentication systems commonly used to secure APIs and web applications. They play distinct roles in providing secure and efficient authentication and authorization processes.

Access Tokens:

Purpose: An access token is a credential that represents the authorization granted to a client (e.g., a user or application) to access a protected resource (e.g., an API endpoint).
Usage: Clients include the access token in the Authorization header of HTTP requests to access protected resources. The server verifies the token to ensure the client has the necessary permissions.
Lifespan: Access tokens have a relatively short lifespan to enhance security. When they expire, clients must obtain a new access token by authenticating again.
Refresh Tokens:

Purpose: A refresh token is a long-lived credential that is used to obtain a new access token when the current access token expires.
Usage: When the access token expires, the client can present the refresh token to the authentication server to obtain a new access token without requiring the user to re-enter their credentials.
Lifespan: Refresh tokens have a longer lifespan compared to access tokens. They are used to request new access tokens and are typically kept secure on the client side.
Typical Authentication Flow:

The client authenticates with the authentication server using credentials (e.g., username and password) and receives both an access token and a refresh token.
The client includes the access token in API requests to access protected resources.
When the access token expires, the client uses the refresh token to obtain a new access token without requiring the user to log in again.
If the refresh token expires or becomes invalid, the client must re-authenticate with the server to obtain new tokens.



using the index: true allows us to make searching in the database more efficient and optimized.



PRE MIDDLE FUNCTIONS (Eg. HASHING A PASSWORD USING BCRYPT)
In the context of Mongoose, a popular ODM (Object Data Modeling) library for MongoDB and Node.js, pre-middleware functions are functions that are executed before certain operations, such as saving or updating a document in the database. These functions allow you to perform actions or modify data before the actual operation takes place.

Here's an explanation using Mongoose as an example:

Middleware Functions:

Mongoose middleware functions are functions that can intercept and execute code before or after certain events occur, like saving a document or querying the database.
Pre Middleware:

Pre middleware functions specifically run before a particular operation. They are often used to perform actions like data validation, modification, or executing additional logic before the database operation.
Use Cases:

Common use cases for pre middleware include hashing passwords before saving a user, performing validation checks, or updating timestamps.
Example - Hashing Passwords:

Suppose you have a Mongoose schema for a user, and you want to hash the user's password before saving it to the database. You can use a pre middleware function for this:
*/