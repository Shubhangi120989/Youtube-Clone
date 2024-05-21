import mongoose, {isValidObjectId, sanitizeFilter} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name||!description){
        throw new ApiError(400,"name or description not provided")

    }
    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user?._id
    })
    return res.status(200).json(new ApiResponse(200,playlist,"New PlayList Created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playlists=await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $addFields:{
                totalVideos:{
                    $size:"$videos"
                }
            }
        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                totalVideos:1
                
            
            }

        }
    ])
    return res.status(200).json(new ApiResponse(200,playlists,"User PlayList successfully fetched"))



})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist=await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId)
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
                            username:1,
                            fullName:1,
                            avatar:1,
                            _id:1
                        }
                    }
                ]
            },

        },{
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos",
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
                                        username:1,
                                        _id:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        },
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
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

        },
        {
            $project:{
                _id:1,
                name:1,
                description:1,
                owner:1,
                videos:1
            
            }

        }
    ])
    if(!playlist[0]){
        throw new ApiError(400,"Playlist not found")
    }
    return res.status(200).json(new ApiResponse(200,playlist[0],"PlayList Fetched successfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    // console.log("the playlist in" ,playlist)
    // console.log(playlist.owner)
    // console.log(req.user?._id)
    const owner=playlist.owner
    if(owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"Unauthorized access")
    }
   
    const video=Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    
    if(!playlist.videos.includes(videoId)){
        playlist.videos.push(videoId)
        await playlist.save({ validateBeforeSave: false })

    }
    return res.status(200).json(new ApiResponse(200,playlist,"Video added to the playlist"))
    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    
    
    const playlist=await Playlist.findById(playlistId)
    if(playlist.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"Unauthorized access")
    }

    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    // Check if the video exists in the playlist
    const videoIndex = playlist.videos.indexOf(videoId);
    if (videoIndex === -1) {
      throw new ApiError(404, 'Video not found in the playlist');
    }
    playlist.videos.splice(videoIndex, 1);
    await playlist.save({ validateBeforeSave: false });
    
    return res.status(200).json(new ApiResponse(200,{},"Video deleted from the playlist"))
    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const playlist=await Playlist.findById(playlistId)
    if(playlist.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"Unauthorized access")
    }
    const playlist2=await Playlist.findByIdAndDelete(playlistId)
    if(!playlist2){
        throw new ApiError(401,"problem while deleting the playlist")
    }
    return res.status(200).json(new ApiResponse(200,{},"Playlist deleted successfully"))
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    const playlist=await Playlist.findById(playlistId)
    if(playlist.owner._id.toString() !== req.user?._id.toString()){
        throw new ApiError(400,"Unauthorized access")
    }
    if(!playlist){
        throw new ApiError(400,"PlayList not found")
    }
    if(!name&&!description){
        throw new ApiError(400,"insufficent update info given")

    }
    if(name){
        playlist.name=name;
    }
    if(description){
        playlist.description=description
    }
    playlist.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,playlist,"Playlist updated successfully"))

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}