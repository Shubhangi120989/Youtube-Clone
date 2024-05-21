import mongoose, {Mongoose, isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId=req.user?._id;
    if(!userId){
        throw new ApiError(400,"You must be logged in")
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"Video not found")
    }
    const liked=await Like.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },{
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        }
    ])
    let mssg=""
    if(liked.length===0){
        //create kro
        const like=await Like.create({
            video:videoId,
            likedBy:userId
        })
        if(!like){
            throw new ApiError(400,"Problem while adding a like")
        }
        mssg="Added a like"
    }else{
        //delete kro
        const likeId=liked[0]._id
        const like=await Like.findByIdAndDelete(likeId)
        if(!like){
            throw new ApiError(400,"Problem while removing the like")
        }
        mssg="removed the like"
    }

    res.status(200).json(new ApiResponse(200,{},mssg))
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId=req.user?._id;
    if(!userId){
        throw new ApiError(400,"You must be logged in")
    }
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(400,"comment not found")
    }
    const liked=await Like.aggregate([
        {
            $match:{
                comment:new mongoose.Types.ObjectId(commentId)
            }
        },{
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        }
    ])
    let mssg=""
    if(liked.length===0){
        //create kro
        const like=await Like.create({
            comment:commentId,
            likedBy:userId
        })
        if(!like){
            throw new ApiError(400,"Problem while adding a like")
        }
        mssg="Added a like"
    }else{
        //delete kro
        const likeId=liked[0]._id
        const like=await Like.findByIdAndDelete(likeId)
        if(!like){
            throw new ApiError(400,"Problem while removing the like")
        }
        mssg="removed the like"
    }

    res.status(200).json(new ApiResponse(200,{},mssg))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId=req.user?._id;
    if(!userId){
        throw new ApiError(400,"You must be logged in")
    }
    const tweet=await Tweet.findById(tweet);
    if(!tweet){
        throw new ApiError(400,"Tweet not found")
    }
    const liked=await Like.aggregate([
        {
            $match:{
                tweet:new mongoose.Types.ObjectId(tweetId)
            }
        },{
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        }
    ])
    let mssg=""
    if(liked.length===0){
        //create kro
        const like=await Like.create({
            tweet:tweetId,
            likedBy:userId
        })
        if(!like){
            throw new ApiError(400,"Problem while adding a like to the vid")
        }
        mssg="Added a like"
    }else{
        //delete kro
        const likeId=liked[0]._id
        const like=await Like.findByIdAndDelete(likeId)
        if(!like){
            throw new ApiError(400,"Problem while removing the like")
        }
        mssg="removed the like"
    }

    res.status(200).json(new ApiResponse(200,{},mssg))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId=req.user?._id
    if(!userId){
        throw new ApiError(400,"User not logged in")
    }
    const likedVid=await Like.aggregate([
        {
            $match:{
                video:{
                    $ne: null 
                }
            }
        },{
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        avatar:1,
                                        username:1

                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            },
        },{
            $addFields:{
                videoDetails:{
                    $first:"$videoDetails"
                }
            }
        },{
            $project:{
                video:1,
                videoDetails:1
            }
        }
    ])
    
    res.status(200).json(new ApiResponse(200,likedVid,"Liked Video fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}