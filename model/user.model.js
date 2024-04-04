import mongoose from "mongoose";

export const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique : [true, 'Username is already taken']
    },
    password: {
        type: String,
        required: [true,"how you plan to login without password?"],
        unique: false
    },
    email: {
        type: String,
        required: [true,"need email for backup" ],
        unique : [true, 'Email is already taken']
    },

    type:{
        type:String,
        require:true
    },

    fu:{
        type: Number,
        required: false
    },
    isVerified:{
        type:Boolean,
        require:false
    }
    
},
{versionKey:false}

);

export default mongoose.model('Users', UserSchema);


