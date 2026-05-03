import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import { ObjectId } from "mongodb";

export const getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const userEmail = req.decodedEmail;

        const conversation = await Conversation.findById(id);

        if (!conversation.participants.includes(userEmail)) {
            return res.status(403).send({ message: "Forbidden" });
        }

        const messages = await Message.find({
            conversationId: new ObjectId(id),
        });

        res.status(200).send({
            isSuccess: true,
            messages,
        });

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};