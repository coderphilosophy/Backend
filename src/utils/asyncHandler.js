const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}
 
export {asyncHandler}

//higher order function -> passing a function as a parameter.

//THIS IS THE TRY CATCH VERSION
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }


/*
NOTES: 

const asyncHandler = (requestHandler) => { ... }: This line declares a constant asyncHandler and assigns it a function. This function takes another function requestHandler as a parameter.

(req, res, next) => { ... }: This inner function is an anonymous function that takes the standard Express middleware parameters: req (request), res (response), and next (next middleware function in the chain).

Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)): This line wraps the execution of requestHandler in a Promise. It resolves the Promise with the result of calling requestHandler(req, res, next). If an error occurs during the execution of requestHandler, the catch block is triggered, and it calls the next function with the error as an argument. This is a common pattern for handling asynchronous operations and errors in Express middleware.
*/