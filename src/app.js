import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//SETTING SOME MIDDLEWARES FOR BETTER APP MAKING AND HANDLING

//to put limit on amount of json data
app.use(express.json({limit:"16kb"}))
//url encoding different ho skte h so usse smjhne ke liye
app.use(express.urlencoded({extended:true,limit:"16kb"}))
//public folder banana, to keep public assets
app.use(express.static("public"))

//TO ACCESS AND SET COOKIES FROM THE BROWSERS
//THERE ARE WAYS IN WHICH WE CAN KEEP SECURE COOKIES IN USERS BROWSER
//THESE COOKIES AND BE ACCESSED BY SERVER ONLY

app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'

//routes declaration

//to activate a particular router
//bringing the middleware
//we give the route plus the router that has to be activated
app.use("/api/v1/users",userRouter);


export {app}