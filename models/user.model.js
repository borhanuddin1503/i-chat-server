import mongoose from "mongoose";

// schema define
const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        default: 'user',
        type: String,
    },
    hashedPassword: {
        type: String,
    },
    provider: String,
    image: String,
    username: String

},
    { timestamps: true }
)


// model define
const User = mongoose.model('User', userSchema );
export default User;