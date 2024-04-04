import { set, connect } from 'mongoose';
import express from 'express';
import dotenv from 'dotenv';
const app = express();
dotenv.config();
set('strictQuery',false)
const connectDB = async () => {
try{
    const conn = await connect(process.env.MongoDB);
   
    console.log(`connected to ${conn.connection.host}`)
}
catch(error){console.log(error)}
}
export default connectDB;