import { Router } from "express";
import { registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,updateAccountDetails,updateUserAvatar,updateUserCoverImage, getCurrentUser,getUserChannelProfile,getWatchHistory} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"coverImage",
            maxCount:1
            
        },
        {
            name:"avatar",//frontend m bhi same name hona chahiye
            maxCount:1
            
        },
        
    ]),
    registerUser)

//how the url will be created, when /users call hota userRouter activate
//hoga fir usme /register hoga call
//http://localhost:8000/api/v1/users/register


router.route("/login").post(loginUser)

//secured routes
//inserting the verifyJWT middleware
//verifyJWT will insert user details into the 
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)

//patch route is used here so that saari details update na ho (post mat rkh dena glti se)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/current-user").get(verifyJWT,getCurrentUser)

//yahan pr hum username params m se le rhe h
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router