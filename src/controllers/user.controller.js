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
    if(fullName===""){
        throw new ApiError(400,"Fullname is required")
    }

    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user exists in db
    // import User from models
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")

    }


    //multer will give req.files ka access (as we have introduced tht middlewar)
    //avatar ke first property ke andar ek object milta h, uska path mil jaega
   
    console.log("files",req.files);
    const avatarLocaPath=await req.files?.avatar[0]?.path
    console.log("avatarLocaPath",avatarLocaPath);
    let coverImageLocalPath=''
    if(req.files){
        if(req.files.coverImage){
            console.log("Getting cover image...")
            // console.log("Path", req.files.coverImage[0].path);
            coverImageLocalPath= req.files.coverImage[0].path
            console.log(coverImageLocalPath);
        }
    }
   
    // const coverImageLocalPath=req.files?.coverImage[0]?.path;
    console.log("coverImageLocalPath",coverImageLocalPath)

    if(!avatarLocaPath){
        throw new ApiError(400,"Avatar file is required");
    }

    // //upload avatar on cloudinary
    // //import uploadOnCloudinary
    const avatar= await uploadOnCloudinary(avatarLocaPath)
    console.log("Avatar", avatar);
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    console.log("coverImage", coverImage);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // // // create a new object and upload on database
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

//to generate access and refresh tokens:
const generateAccessAndRefreshTokens=(async(userId)=>{
    {
        try{
            const user=await User.findById(userId)
            const accessToken=user.generateAccessToken()
            const refreshToken=user.generateRefreshToken()
    
            //we have to add this refresh token into the user object and save it
            //jab save krenge toh mongoose ke models kickin hojate
            //so validateBeforeSave false krenge taaki baaki cheeze na validate ho
    
            user.refreshToken=refreshToken;
            await user.save({validateBeforeSave:false})
            return {accessToken,refreshToken}
    
    
        }catch(error){
            throw new ApiError(500,"Something went wrong while generating refresh and access token")
        }
    }

})


// const loginUser=asyncHandler(async(req,res)=>{
//     //req body-> data
//     //username or email
//     //find the user
//     //password check
//     //access and refress token
//     //send cookie 
//     //res send for successful login

//     const {email,username,password}=req.body;
//     console.log(email);
//     if(!username&&!email){
//         throw new ApiError(400,"username or email is required")
//     }
//     const user=User.findOne({
//         $or: [{username},{email}]
//     })
//     if(!user){
//         throw new ApiError((404,"User does no exist"))
//     }

//     //check password

//     //since we have created our own methods to bycrypt and decrypt password
//     //it will be inside user(what we got from findOne) and User, User m mongoose ke methods honge
//     const isPasswordValid=await user.idPasswordCorrect(password)
//     if(!isPasswordValid){
//         throw new ApiError(401,"Invalid user credentials")
//     }

//     //generate access and refress tokens
//     const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
//     //since hmara current user wla variable m refresh token updated ni h
//     //we will have to again make a query updated wla laane ke liye
//     //else hum isme bhi update kr stke the
    
//     const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
    
//     //ye sab true krne se cookies server se hi modifiable hongi (frontend se ni)
//     const options={
//         httpOnly:true,
//         secure:true
//     }

//     return res
//     .status(200)
//     .cookie("accessToken",accessToken,options)
//     .cookie("refreshToken",refreshToken,options)
//     .json(
//         new ApiResponse(
//             200,{
//                 user:loggedInUser,accessToken,refreshToken
//             },
//             "User logged in successfully"
//         )
//     )


// })
const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);
    console.log(req.body)

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})
const logoutUser=asyncHandler(async(req,res)=>{
    //clear the cookies
    //remove the refresh token from the user object

    //removing the refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            //update krna kya h
            $set:{
                refreshToken:undefined
            },
            
        },
        {
            new:true

        }
    )
    //clearing the cookie
    //ye sab true krne se cookies server se hi modifiable hongi (frontend se ni)
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))
})

export {registerUser,loginUser,logoutUser}  