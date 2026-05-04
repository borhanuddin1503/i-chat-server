import mongoose from "mongoose";

const messageModel = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation"
    },
    sender: String,
    message: String,
    images: Array,
    hasImages: Boolean,
    audio: String,
    hasAudio: Boolean,
    audioDuration: Number,
},
    {
        timestamps: true,
    }
)



const Message = mongoose.model('Message', messageModel);
export default Message;