import { Router } from "express";
import { registerUser,loginUser,logoutUser } from "../controllers/user.controller.js";
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

export default router