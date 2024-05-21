import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {username}=req.params
    // const channel=await User.aggregate([
    //     {
    //         $match:{
    //             //this will give only those entries with matching username
    //             username:username?.toLowerCase()
    //         }
    //     },{
    //         $lookup:{
    //             //to find number of subscribers
    //             //will return a new field (type=array) with all the (subscribtion model) objects in an array jiska channel name same
    //             from:"subscriptions",//small case nd plural collection name
    //             localField:"_id",
    //             foreignField:"channel",
    //             as:"subscribers"        
    //         }
    //     },{
    //         //to find number of channel subscribed
    //         //will return a new field (type=array) with all the (subscribtion model) objects in an array jiska subscriber name same
    //         $lookup:{
    //             from:"subscriptions",
    //         localField:"_id",
    //         foreignField:"subscriber",
    //         as:"subscribed"
    //         }
    //     },{
    //         $lookup:{
    //             from:"videos",
    //             localField:"_id",
    //             foreignField:"_owner",
    //             as:"videos"
    //         }
    //     },{
    //         lookup:{
    //             from:"playlists",
    //             localField:"_id",
    //             foreignField:"owner",
    //             as:"playlists"
    //         }
    //     },
    //     {
    //         $addFields:{
    //             subscribersCount:{
    //                 $size:"$subscribers"
    //             },
    //             channelsSubscribedToCount:{
    //                 $size:"$subscribed"
    //             },
    //             //to check if the current logged in user is subscirbed or not to the searched user
    //             isSubscribed:{
    //                 $cond:{
    //                     if:{$in:[req.user?._id,"$subscribers.subscriber"]},
    //                     then:true,
    //                     else:false
    //                 }
    //             },
    //             videosCount:{
    //                 $size:"$videos"
    //             },
    //             playlistCount:{
    //                 $size:"$playlists"
    //             }
    //         }        
    //     },{
    //         $project:{
    //             fullName:1,
    //             username:1,
    //             subscribersCount:1,
    //             channelsSubscribedToCount:1,
    //             isSubscribed:1,
    //             avatar:1,
    //             coverImage:1,
    //             email:1,
    //             videosCount:1,
    //             playlistCount:1
    //         }
    //     }
    // ])
    // if(!channel[0]){
    //     throw new ApiError(400,"channel not found")
    // }
    const userId=await User.findOne({
        username:username.toLowerCase()
    })
    if(!userId){
        throw new ApiError(400,"No channel found")
    }
    const totalVideos=await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"_video",
                as:"likes"
            }
        },{
            $addFields:{
                likes:{
                    $size:"$likes"
                }
            }
        },{
            $group: {
                _id: null, // We don't need to group by any specific field
                totalViews: { $sum: "$views" }, // Sum up the views
                videoCount: { $sum: 1 },// Count the number of videos
                likesCount:{$sum:"$likes"}
            }
        },{
            $project:{
                _id: 0, // Remove the _id field
            totalViews: 1, // Include the totalViews field
            videoCount: 1 ,// Include the videos array
            likesCount:1
            }
        }
    ])
    const totalSubscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(userId)
            }
        },{
            $group:{
                _id:null,
                totalSubscribers:{ $sum: 1 }

            }
        },{
            $project:{
                _id:0,
                totalSubscribers:1
            }
        }
    ])
    


    console.log(totalVideos)

const data={
    totalSubscribers:totalSubscribers[0].totalSubscribers,
    totalViews:totalVideos[0].totalViews,
    totalLikes:totalVideos[0].likesCount,
    totalVideos:totalVideos[0].videoCount
}
console.log(data)

    return res.status(200).json(new ApiResponse(200,data,"Channel stats fetched successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {username}=req.params
    const user=await User.findOne({username:username.toLowerCase()})
    console.log(user)
    if(!user){
        throw new ApiError(401,"Channel not found")
    }
    // const videos=await User.aggregate([
    //     {
    //         $match:{
    //             username:username.toLowerCase()
    //         },

    //     },
    //     {
    //         $lookup:{
    //             from:"videos",
    //             localField:"_id",
    //             foreignField:"owner",
    //             as:"videos",
    //             pipline:[
    //                 {
    //                     $project:{
    //                         videoFile:1,
    //                         thumbnail:1,
    //                         title:1,
    //                         description:1,
    //                         views:1,
    //                         isPublished:1
    //                     }
    //                 }
    //             ]
    //         }
    //     },{
    //         $project:{
    //             videos:1
    //         }
    //     }
    // ])
    // if(!videos){
    //     throw new ApiError(400,"channel not available")
    // }
    const videos=await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(user._id)
            }
        }
    ])
    res.status(200).json(new ApiResponse(200,videos,"Channel Videos fetched successfully"))

})

export {
    getChannelStats, 
    getChannelVideos
    }