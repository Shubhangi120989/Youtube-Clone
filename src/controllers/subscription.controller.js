import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const userId=req.user?._id;
    if(!userId){
        throw new ApiError(400,"Make sure to login")

    }
    const channel=await User.findById(channelId);
    if(!channel){
        throw new ApiError(200,"Channel not found")
    }
    const subscription=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId),
                
            }
        },{
            $match:{
                subscriber:new mongoose.Types.ObjectId(userId)

            }
        }
    ])
    // console.log(subscription)
    let mssg=""

    if(subscription.length===0){
        //create kro
        const newSubscription=await Subscription.create({
            channel:channelId,
            subscriber:userId
        })
        if(!newSubscription){
            throw new ApiError(400,"Error while subscribing")
        }
        mssg="Subscribed!"
    }else{
        //delete kro
        const subscriptionId=subscription[0]._id
        const newSubscription=await Subscription.findByIdAndDelete(subscriptionId)
        // console.log(newSubscription)
        if(!newSubscription){
            throw new ApiError(400,"Error while unsubscribing")
        }
        mssg="Unsubscribed!"

    }
    return res.status(200).json(new ApiResponse(200,{},mssg))
   


})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    // const {channelId} = req.params
    
    
    const userId=req.user?._id;
    if(!userId){
        throw new ApiError(400,"Make sure to login")

    }
    // const channel=await User.findById(userId);
    // if(!channel){
    //     throw new ApiError(200,"Channel not found")
    // }
    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberDetails",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                            _id:1
                        }
                    }
                ]
            }
            
        },{
            $addFields:{
                subscriberDetails:{
                    $first:"$subscriberDetails"
                }
            }
        },
        {
            $project:{
                subscriberDetails:1
            }
        }
    ])
    if(!subscribers){
        throw new ApiError(400,"problem while fetching subscribers details")
    }
    return res.status(200).json(new ApiResponse(200,subscribers,"Subscribers list fetched successfully"))


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // const { subscriberId } = req.params
    
    
    
    const userId=req.user?._id;
    if(!userId){
        throw new ApiError(400,"Make sure to login")

    }
   const subscribedChannels=await Subscription.aggregate([
    {
        $match:{
            subscriber:new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"channel",
            foreignField:"_id",
            as:"channelDetails",
            pipeline:[
                {
                    $project:{
                        fullName:1,
                        username:1,
                        avatar:1,
                        _id:1
                    }
                }
            ]
        },
    },{
        $addFields:{
            channelDetails:{
                $first:"$channelDetails"
            }
        }
    },{
        $project:{
            channelDetails:1
        }
    }
   ])
//    console.log(subscribedChannels)
   return res.status(200).json(new ApiResponse(200,subscribedChannels,"Subscribed channels fetched all"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}