import mongoose from 'mongoose'
import dotenv from 'dotenv';
dotenv.config();

export default async function DBConnect() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Mongooes connected successfully')
    } catch (error) {
        console.log('connection failed', error.message)
    }
}
