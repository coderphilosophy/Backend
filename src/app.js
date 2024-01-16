import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//handling all the types of data that our backend will receive like json, url data or form data.

app.use(express.json({limit: "16kb"})) //form data

app.use(express.urlencoded({extended: true, limit: "16kb"})) //for url's

app.use(express.static("public")) //for files like images, favicons icons etc.

app.use(cookieParser())

export {app}

/*
NOTES

USE OF COOKIE PARSER: to be able to set and get the cookies from the user's browser from the server.
(main mere server se user ke browser ki cookies access bhi kar pau aur set bhi kar pau)

 app.use(cors(...)): This line is telling your Express application (app) to use the cors middleware for all routes. Middleware in Express are functions that have access to the request, response, and the next middleware function in the application’s request-response cycle.

 origin: process.env.CORS_ORIGIN: This part sets the allowed origin(s) for cross-origin resource sharing. It's reading the allowed origin from an environment variable named CORS_ORIGIN. The allowed origin is the domain (or domains) that are permitted to make requests to your server. If CORS_ORIGIN is not set or is set to a wildcard (*), it means any domain is allowed.

 credentials: true: This indicates that the server is willing to accept credentials (such as cookies, HTTP authentication, and client-side SSL certificates) during cross-origin requests. If your client-side code needs to include credentials in the request (e.g., for authenticated sessions), this setting is necessary.


 app.use(express.urlencoded({extended: true, limit: "16kb"}))

 this line of code sets up your Express application to parse incoming URL-encoded data from the request body, allowing you to work with form data submitted to your server. The extended: true option enables the use of rich object notation, and the limit: "16kb" option sets a maximum size for the data.
 */