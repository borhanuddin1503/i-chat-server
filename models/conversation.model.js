import mongoose from "mongoose";

const conversationModel = new mongoose.Schema({
    participants: [String],
    lastMessage: String,
    lastSender: String,
    seenBy: {
        type: [String],
    },
},
    { timestamps: true }
)

const Conversation = mongoose.model('Conversation', conversationModel)
export default Conversation;