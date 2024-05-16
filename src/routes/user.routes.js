import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"coverImage",
            
        },
        {
            name:"avatar",//frontend m bhi same name hona chahiye
            
        },
        
    ]),
    registerUser)

//how the url will be created, whern /users call hota userRouter activate
//hoga fir usme /register hoga call
//http://localhost:8000/api/v1/users/register



export default router