import { Router } from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js"
const router = Router();
import { addComment,deleteComment,updateComment,getVideoComments } from '../controllers/comment.controller.js';

router.use(verifyJWT);
router.route("/:title").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);



export default router