import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';

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
    // console.log(username)
    // console.log(fullName)
    // console.log(password)

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
const generateAccessAndRefereshTokens=(async(userId)=>{
    {
        try{
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()
    
    
            //we have to add this refresh token into the user object and save it
            //jab save krenge toh mongoose ke models kickin hojate
            //so validateBeforeSave false krenge taaki baaki cheeze na validate ho
    
            user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}

    
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
//     const user=await User.findOne({
//         $or: [{username},{email}]
//     })
//     if(!user){
//         throw new ApiError((404,"User does no exist"))
//     }

//     //check password

//     //since we have created our own methods to bycrypt and decrypt password
//     //it will be inside user(what we got from findOne) and User, User m mongoose ke methods honge
//     const isPasswordValid = await user.isPasswordCorrect(password)
//     if(!isPasswordValid){
//         throw new ApiError(401,"Invalid user credentials")
//     }

//     //generate access and refress tokens
//     const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)
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
        httpOnly: true, // Makes the cookie inaccessible to JavaScript (prevents XSS)
        secure: process.env.NODE_ENV === 'production', // Ensures cookie is sent only over HTTPS
        sameSite: 'Lax', // Controls if the cookie should be sent with cross-site requests
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
            $unset:{
                refreshToken:1
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

const refreshAccessToken=asyncHandler(async(req,res)=>{
    //access the refresh tokens sent in req through the cookies or through the req.body
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshAccessToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")

    }

    try {
        //verify the token (that is getting the raw token, user ke paas toh encrypted jata h)
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        console.log(decodedToken)
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        //matching the database ka token and req(or cookies) ka token
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Expired or used refresh Token")
    
        }
        //saari verifcation is complete, now generate new access token
    
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id);
        
        //return and cookie bhi update krdo for refresh and access token
        return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,{accessToken,refreshToken},"Access token refreshed successfully")
        )
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh token")
    }



})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const{oldPassword,newPassoword}=req.body;
    //if a user is attempting to change the password that means it is already logged in
    //similar to logout routine auth middleware daalenge hum(req m user field hoga fir)
    console.log(req.body)
    const user=await User.findById(req.user?._id)

    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid password")
    }
    //update now
    user.password=newPassoword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))

    
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    try {
        return res
        .status(200)
        .json(new ApiResponse(200,req.user,"current user fetched successfully"))
    } catch (error) {
        throw new ApiError(401,error.message||"user not found")
    }
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName||!email){
        throw new ApiError(400,"All fields are required")
    }
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullName:fullName,
                    email:email
                }
            },
            {new:true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Accouts details updated succesfully"))
    
})

//we will learn how to update the files
const updateUserAvatar=asyncHandler(async(req,res)=>{
    //multer middleware daalna h
    //yahan par ek hi file leni h so we will use req.file
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar:avatar.url

        }
    },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading the cover image")
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage:coverImage.url

        }
    },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"CoverImage updated successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    //we have to get the user details from the url (and not from the body)
    //so we will use params
    const {username}=req.params
    console.log(username)
    if(!username?.trim){
        throw new ApiError(400,"Username is missing")
    }
    const channel=await User.aggregate([
        {
            $match:{
                //this will give only those entries with matching username
                username:username?.toLowerCase()
            }
        },{
            $lookup:{
                //to find number of subscribers
                //will return a new field (type=array) with all the (subscribtion model) objects in an array jiska channel name same
                from:"subscriptions",//small case nd plural collection name
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"        
            }
        },{
            //to find number of channel subscribed
            //will return a new field (type=array) with all the (subscribtion model) objects in an array jiska subscriber name same
            $lookup:{
                from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribed"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribed"
                },
                //to check if the current logged in user is subscirbed or not to the searched user
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }        
        },{
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    //channel will be of array type, jime ek 

    if(!channel?.length){
        throw new ApiError(404,"channel doeas not exists")

    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )

})


const getWatchHistory=asyncHandler(async(req,res)=>{
    //user._id m string milti h pr jab usse mongoose m use krte h tob vo automatically original id m convert krke use krta
    //but aggregate method ke andar mongoose does not work directly code jata h toh hume string se original object m convert krna pdega
    // const user=await User.aggregate([
    //     {
    //         //getting the user
    //         $match:{
    //             //converting to id object from the string
    //             _id: new mongoose.Types.ObjectId(req.user?._id)
    //         }
    //     },
    //     {
    //         $lookup:{
    //             from:"videos",
    //             localField:"watchHistory",
    //             foreignField:"_id",
    //             as:"watchHistory",
    //             //to implement nested lookup, so that we get the owner detail (which is a user) also
    //             pipeline:[
    //                 //ab hum videos ke andar h
    //                 {
    //                     $lookup:{
    //                     from:"users",
    //                     localField:"owner",
    //                     foreignField:"_id",
    //                     as:"owner",
    //                     //isme se sirf owner ke kuch details hi chahiye so further pipline laga rhe
    //                     pipeline:[
    //                         {
    //                             $project:{
    //                                 fullName:1,
    //                                 username:1,
    //                                 avatar:1
    //                             }
    //                         },//for convienience isme owner ka ek array hoka jisme first index m owner ka object hoga
    //                         //so rather we will add a new field of the same name (overwriting) jisme directly owner object daalenge
                            

    //                     ]

    //                 }
    //             },{
    //                 $addFields:{
    //                     owner:{
    //                         //mtlb first value of the array owner field
    //                         $first:"$owner"
    //                     },
    //                     ageInDays:{
    //                         $divide: [
    //                             { $subtract: [new Date(), "$createdAt"] },
    //                             1000 * 60 * 60 * 24
    //                           ]
    //                     }
    //                 }

    //             }
    //             ]
    //         }
    //     },
    //     // {
    //     //     $project:{

    //     //     }
    //     // }

    // ])
    //to get in same sequence as in database
    const user = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.user?._id)
          }
        },
        {
          $lookup: {
            from: "videos",
            let: { watchHistory: "$watchHistory" },
            pipeline: [
              { 
                $match: { 
                  $expr: { 
                    $in: ["$_id", "$$watchHistory"] 
                  } 
                } 
              },
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                  pipeline: [
                    {
                      $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1
                      }
                    }
                  ]
                }
              },
              {
                $addFields: {
                  owner: { $first: "$owner" },
                  ageInDays: {
                    $divide: [
                      { $subtract: [new Date(), "$createdAt"] },
                      1000 * 60 * 60 * 24
                    ]
                  }
                }
              }
            ],
            as: "watchHistoryDetails"
          }
        },
        {
          $project: {
            watchHistory: {
              $map: {
                input: "$watchHistory",
                as: "id",
                in: {
                  $arrayElemAt: [
                    "$watchHistoryDetails",
                    { $indexOfArray: ["$watchHistoryDetails._id", "$$id"] }
                  ]
                }
              }
            }
          }
        }
      ]);

    //user will be an array jisme first value kaam ki hoti

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,user[0],"Watch history fetched successfully"
        )
    )
})




export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory}  