import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {title} = req.params
    const video=await Video.findOne({title:title.replace(/-/g, ' ')})
    if(!video){
        throw new ApiError(400,"Video does not exist")
    }
    const {page = 1, limit = 10} = req.query 
    const options={
        page,
        limit,
        sort:{createdAt:-1}
    }
    const comments=await Comment.aggregatePaginate(
        Comment.aggregate([
            {
                $match:{
                    video:new mongoose.Types.ObjectId(video._id)
                },
            },{
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"comment",
                    as:"likes"
                }
            },
            {
                $lookup:{
                    from:'users',
                    localField:"owner",
                    foreignField:'_id',
                    as:"owner",
                    pipeline:[
                        {
                            $project:{
                                fullname:1,
                                avatar:1,
                                username:1
                            }
                        }
                    ]
                },
            },
            {
                $addFields:{
                    owner:{
                        $first:"$owner"
                    },
                    likes:{
                        $size:"$likes"
                    }
                    
                }
            },{
                $project:{
                    _id:1,
                    content:1,
                    createdAt:1,
                    updatedAt:1,
                    owner:1,
                    likes:1

                }
            }
        ]),
        options
    )

    if(!comments){
        throw new ApiError(400,"Problem while fetching comments")

    }
    return res.status(200).json(new ApiResponse(200,comments,"Comments fetched successfully"))



})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {title} = req.params
    const {content}=req.body
    const userId=req.user?._id;
    const video=await Video.findOne({title:title.replace(/-/g, ' ')})
    if(!video){
        throw new ApiError(400,"No such Video found")
    }

    // if(!userId){
    //     throw new ApiError(400,"Not logged in")
    // }
    if(!content){
        throw new ApiError(400,"Post a valid commnet")

    }
    // console.log(video)
    // console.log(video._id)
    const comment=await Comment.create({
        content:content.trim(),
        video:video._id,
        owner:userId
        
    })

    return res.status(200).json(new ApiResponse(200,comment,"Comment posted successfully"))
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    
    const {commentId}=req.params
    const userId=req.user?._id;
    const {content}=req.body
    
    if(!userId){
        throw new ApiError(400,"Not logged in")
    }
    const comment=await Comment.findById(commentId)
    if(comment.owner._id.toString() !== userId.toString()){
        throw new ApiError(400,"Unauthorized access")
    }
    
    
    if(!content){
        throw new ApiError(400,"Post a valid commnet")

    }
    // const comment=await Comment.findByIdAndUpdate({_id:commentId},{content},{new:true})
    comment.content=content
    comment.save({validateBeforeSave: false })

    // if(!comment){
    //     throw new ApiError(400,"incorrect id or problem while updating")
    // }

    return res.status(200).json(new ApiResponse(200,comment,"comment Upadted successfully"))
    
    

})
const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params
    const userId=req.user?._id;
    const comment= await Comment.getById(commentId)

    if(!userId){
        throw new ApiError(400,"Not logged in")
    }
    if(!userId.toString()==comment.owner._id.toString()){
        throw new ApiError(400,"unauthorised access")

    }
    const commentD=await Comment.findByIdAndDelete(commentId);
    if(!commentD){
        throw new ApiError(400,"ivalid comment id")
    }

    return res.status(200).json(new ApiResponse(200,{},"Comment deleted successfully"))

})

export {getVideoComments,addComment,updateComment,deleteComment}