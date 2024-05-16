//here Error class belong to node js
class ApiError extends Error{
    constructor(
        statusCode,
        message="Somthing went wrong",
        errors=[],
        stack=""

    ){
        //for overriding
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false;
        this.errors=errors

        if(stack){
            this.stack=stack

        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}