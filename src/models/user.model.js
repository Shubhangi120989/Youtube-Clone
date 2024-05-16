import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema=new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true//search krne ke liye use krna h toh index true rkho
        },
        email:{
            type:String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullName:{
            type:String,
            required: true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,//cloudinary url
            required: true,
            
        },
        coverImage:{
            type:String,//cloudinary url
            
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type: String,
            required:[true,'Password is required']
        },
        refreshToken:{
            type:String
        }
            
        

},
{
    timestamps:true
}
)
//yahan pr database m save hona is the triggering event sab encryption krni h
//so we write save here and next ka reference dena h always coz hum middleware use kr rhe
//async function is used because middleware takes time
//nd it is always preferend to make the callback function rather than ()=> type
userSchema.pre("save",async function(next){
    //to make sure ki jab password change hua h tabhi encryption ho
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10)
    next()

})
//adding a new method into the methods object of the user schema
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken=function(){
    //this process fast to no asymc await required
    return jwt.sign(
        //payload m add krr rhe
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
//SINCE REFRESH TOKENS ARE REFRESHED FREQUENTLY WE KEEP LESS INFO IN ITS PAYLOAD
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        //payload m add krr rhe
        {
            _id:this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema);