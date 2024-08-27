// This file contains all variables, values, and others that are used in
// the server side code and the tests code

export const HttpStatusCode = {
    
    // Informational response
    Continue: 100,

    // Successful Response
    Ok: 200,

    // Redirection Response
    TemporaryRedirect: 307,
    FoundRedirection: 302,

    // Client Error Responses
    BadRequest: 400,
    Unauthorized: 401,
    NotFound: 404,
    RequestTimeout: 408,
    Conflict: 409,

    // Server Error Responses
    InternalServerError: 500,

}