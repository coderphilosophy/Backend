class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}

/*
NOTES:

//Super call the constructor of the parent class.

Explanation:

class ApiError extends Error: This line declares a new class named ApiError that extends the built-in Error class. By extending Error, this custom class inherits the behavior and properties of the standard JavaScript Error object.

constructor(statusCode, message = "Something went wrong", errors = [], stack = ""): This is the constructor method of the ApiError class. It takes four parameters: statusCode, message, errors, and stack, with default values provided for message, errors, and stack.

super(message): This line calls the constructor of the superclass (Error) with the specified message. It initializes the error message using the Error constructor.

Properties set in the constructor:

this.statusCode: Stores the HTTP status code associated with the error.
this.data: Initially set to null, representing additional data related to the error.
this.message: Stores the error message.
this.success: Indicates whether the operation was successful (false for errors).
this.errors: An array containing details about the errors.


Stack trace handling:
A stack trace is a representation of the call stack at a particular point of time during the execution of a program.  It provides information about the sequence of function calls that led to the current point of execution where the error or issue occurred.
If a custom stack trace is provided (stack parameter), it sets the stack trace for the error.
If no custom stack trace is provided, it uses Error.captureStackTrace to capture a new stack trace for the current instance of the ApiError class.
export { ApiError };: This exports the ApiError class, making it available for use in other parts of your code.

Overall, this ApiError class is designed to be used for handling and representing errors in an API context, providing flexibility in specifying status codes, error messages, and additional error details

*/