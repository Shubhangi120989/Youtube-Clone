import { Router } from "express";
import { getAllVideos,publishAVideo,getVideoById,updateVideo,togglePublishStatus,deleteVideo} from "../controllers/video.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router=Router()

// router.route("/publishVideo").post(verifyJWT,upload.fields([
//     {
//         name:"videoFile",
//         maxCount:1
//     },{
//         name:"thumbnail",
//         maxCount:1
//     }
// ]),publishAVideo)

// router.route("/:title").get(verifyJWT,getVideoById)
// router.route("/update-video/:title").post(verifyJWT,updateVideo)
// router.route("/toggle-publish/:title").post(verifyJWT,togglePublishStatus)
// router.route("/update-thumbnail/:title").post(verifyJWT,upload.single("thumbnail"),updateThumbnail)

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route('/').get(getAllVideos).post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1,
    },
    {
        name: "thumbnail",
        maxCount: 1,
    },
    
]),
publishAVideo)

router
    .route("/:title")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"),updateVideo)
    

router.route("/toggle-publish/:title").post(verifyJWT,togglePublishStatus)
export default router