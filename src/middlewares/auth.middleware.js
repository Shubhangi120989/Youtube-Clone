import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
//creating our own middleware to verify user h ya ni
export const verifyJWT=asyncHandler(async(req,res,next)=>{
   try {
     //req ke paas cookie ka access h, when we used cookie parser
     //app.use(cookieparser) se humne access de diya tha
     //replace bearer+space with empty string
     const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")
     if(!token){
         throw new ApiError(401,"Unauthorized request")
     }
     //verify kro ki token sahi h na by verifying
     const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
  
     //jab user model m access token generate kr rhe the tab id ko _id krke field banayi thi
     const user=await User.findById(decodedToken._id).select("-password -refreshToken")
 
     if(!user){
         throw new ApiError(401,"Invalid Access Token")
     }
 
     //once hmara user verify ho gya req m user ke details daal do by making a new field
     req.user=user;
     next()
   } catch (error) {
    throw new ApiError(401,error?.message||"Invalid access token")
    
   }
})