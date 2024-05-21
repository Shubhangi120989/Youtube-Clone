import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {v2 as cloudinary} from "cloudinary"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10} = req.query
    const options={
        page,
        limit,
        sort:{createdAt:-1}
    }

    //TODO: get all videos based on query, sort, pagination
    // const videos=await 
    // console.log(videos)
    const videoPage=await Video.aggregatePaginate(Video.aggregate([
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            _id:1,
                            fullName:1
                        }
                    }
                ]
            }

        },{
            $addFields:{
                owner:{
                    $first:"$owner"
                },
                ageInDays: {
                    $divide: [
                      { $subtract: [new Date(), "$createdAt"] },
                      1000 * 60 * 60 * 24
                    ]
                  }

            }
        },
        {
            $project:{
                thumbnail:1,
                _id:1,
                views:1,
                createdAt:1,
                owner:1,
                title:1,
                ageInDays:1
                
            }
        }
    ]),options)
    console.log(videoPage)

    return res.status(200).json(new ApiResponse(200,videoPage,'all the videos fetched successfully'))
})
const getVideoDuration = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: 'video'
        });
        console.log(`Duration: ${result.duration} seconds`);
        return result.duration;
    } catch (error) {
        throw new ApiError(400,error.message||"problem while getting video duration")
    }
}
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,isPublished} = req.body
    // TODO: get video, upload to cloudinary, create video
    console.log(req.body)
    if(!req.user){
        throw new ApiError(400,"Must login to upload a video")
    }

    if([title,description].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"title or description is missing")
    }
    const existingVideo=await Video.findOne({
        title
    })
    if(existingVideo){
        throw new ApiError(400,"Video with same title already exists")
    }

    const videoLocalPath=req.files?.videoFile[0].path
    const thumbnailLocalPath=req.files?.thumbnail[0].path
    if(!videoLocalPath){
        throw new ApiError(400,"Video file not found")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"Local file not found")
    }
    const videoFile=await uploadOnCloudinary(videoLocalPath)
    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!videoFile||!thumbnail){
        throw new ApiError(400,"Problem while uploading on cloudinary")
    }
    const duration=await getVideoDuration(videoFile.public_id)

    const video=await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        owner: req.user?._id,
        title,
        description,
        duration,
        isPublished:isPublished||false
    })
    if(!video){
        throw new ApiError(500,"Error while publishing the video")
    }
    return res.status(201).json(
        new ApiResponse(200,video,"Video Published successfully")
    )

})
const getVideoById = asyncHandler(async (req, res) => {
    const { title } = req.params
    //TODO: get video by id
    console.log(title)
    if(!title?.trim){
        throw new ApiError(400,"Video title is missing")

    }
    //views update properly krne ke liye it is necesssay ki update se kre
    const video = await Video.findOneAndUpdate(
        { title: title.replace(/-/g, ' ') },
        { $inc: { views: 1 } },
        { new: true }
    );
    
    if(!video){
        throw new ApiError(400,"Video not found")
    }
    const userId=req.user?._id;
    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(400,"User must be logged in")
    }
    
    if(!user.watchHistory.includes(video._id)){
        user.watchHistory.push(video._id)
        await user.save({ validateBeforeSave: false })
    }
    const videoDetails= await Video.aggregate([
        {
            $match:{
                _id: video._id
            }
        },{
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullname:1,
                            username:1,
                            avatar:1
                        }
                    },
                ]
            },
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"

            }
        },{
            $addFields:{
                owner:{
                    $first:"$owner"
                },
                likes:{
                    $size:"$likes"
                }
            }

        }
       ,{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likedUsers"
            }
        },{
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"commentedUser",
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
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                },
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
            }

        },
        {
            $addFields:{
                likedCount:{
                    $size:"$likedUsers"
                }, 
                commentsCount:{
                    $size:"$commentedUser"
                },
                isLiked:{
                    $cond:{
                        if:{$in:[req.user?._id,"$likedUsers.likedBy"]},
                    then:true,
                    else:false
                    }
                }
                

            },
        },{
            $project:{
                _id:1,
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                views:1,
                isPublished:1,
                owner:1,
                createdAt:1,
                updatedAt:1,
                likedCount:1,
                commentsCount:1,
                isLiked:1
            }
        }
    ])
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,videoDetails[0],"video fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const {title} = req.params
    //TODO: update video details like title, description, thumbnail

    const video=await Video.findOne({title:title.replace(/-/g, ' ')})
    if(!video){
        throw new ApiError(400,"No video found")
    }
    const owner=video.owner;
    // console.log(owner._id)
    // console.log(req.user?._id)
    if(owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"Unauthorized access to the video")
    }
    const thumbnailLocalPath=req.file?.path
    const{newTitle,description}=req.body;
    if(!newTitle&&!description&&!thumbnailLocalPath){
        throw new ApiError(400,"No update info given")
    }
    if(newTitle){
        const existingVideoTitle=await Video.findOne({title:newTitle})
        if(existingVideoTitle){
            throw new ApiError(400,"Video with given title already exists")
        }
        video.title=newTitle;

    }
    
    if(thumbnailLocalPath){
        const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400,"Problem with uploading on cloudinary")

    }

    video.thumbnail=thumbnail.url;
    }
    
    
    

    
    if(description){
        video.description=description
    }

    await video.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video details updated successfully"))
    


    


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const {title} = req.params
    const video=await Video.findOne({title:title.replace(/-/g, ' ')})
    if(!video){
        throw new ApiError(400,"No video found")
    }
    const owner=video.owner;
    // console.log(owner._id)
    // console.log(req.user?._id)
    if(owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"Unauthorized access to the video")
    }
    if(video.isPublished===true){
        video.isPublished=false
    }else{
        video.isPublished=true
    }
    await video.save({ validateBeforeSave: false })
    return res
    .status(200)
    .json(new ApiResponse(200,video,"publish status changed"))

})

// const updateThumbnail=asyncHandler(async(req,res)=>{
//     const {title} = req.params
//     const video=await Video.findOne({title:title.replace(/-/g, ' ')})
//     if(!video){
//         throw new ApiError(400,"No video found")
//     }
//     const owner=video.owner;
//     // console.log(owner._id)
//     // console.log(req.user?._id)
//     if(owner._id.toString() !== req.user?._id.toString()){
//         throw new ApiError(400,"Unauthorized access to the video")
//     }

//     const thumbnailLocalPath=req.file?.path
//     if(!thumbnailLocalPath){
//         throw new ApiError(400,"thumbnail file missing")
//     }
//     const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)

//     if(!thumbnail){
//         throw new ApiError(400,"Problem with uploading on cloudinary")

//     }

//     video.thumbnail=thumbnail.url;
//     await video.save({ validateBeforeSave: false })

//     return res
//     .status(200)
//     .json(new ApiResponse(200,video,"Thumbnail updated successfully"))



// })

const deleteVideo=asyncHandler(async(req,res)=>{
    const {title} = req.params
    const video=await Video.findOne({title:title.replace(/-/g, ' ')})
    if(!video){
        throw new ApiError(400,"No video found")
    }
    // const owner=video.owner;
    // // console.log(owner._id)
    // // console.log(req.user?._id)
    // if(owner._id.toString() !== req.user?._id.toString()){
    //     throw new ApiError(400,"Unauthorized access to the video")
    // }

    await Video.findByIdAndDelete(video._id)

    return res.status(200).json(new ApiResponse(200,{},"Video deleted successfully"))

})

export {publishAVideo,getVideoById,updateVideo,togglePublishStatus,deleteVideo,getAllVideos}