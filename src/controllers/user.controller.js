import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
const registerUser=asyncHandler(async(req,res)=>{
    //get user details from frontend
    //validation- not empty
    //check if user already exists: through username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object- create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res


    //req.body se we are getting all the info from the frontend
    const {fullName,email,username,password}=req.body;
    console.log("email" ,email)

    //validation
    // if(fullName===""){
    //     throw new ApiError(400,"Fullname is required")
    // }

    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user exists in db
    //import User from models
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")

    }


    //multer will give req.files ka access (as we have introduced tht middlewar)
    //avatar ke first property ke andar ek object milta h, uska path mil jaega
   
    console.log(req.files);
    const avatarLocaPath=await req.files?.avatar[0]?.path
    console.log(avatarLocaPath)
    let coverImageLocalPath=''
    if(req.files){
        if(req.files.coverimage){
            coverImageLocalPath=await req.file.coverimage[0].path
        }
    }
   
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    // console.log(coverImageLocalPath)

    if(!avatarLocaPath){
        throw new ApiError(400,"Avatar file is required");
    }

    //upload avatar on cloudinary
    //import uploadOnCloudinary
    const avatar=await uploadOnCloudinary(avatarLocaPath)
    console.log(avatar)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    
    console.log(coverImage)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }


    //create a new object and upload on database
    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:(coverImage?.url||""),//since not necessary,
        email:email,
        password:password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Error while registering the user")
    }

    //return api response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registerd Successfully")

    )



})

export {registerUser}  