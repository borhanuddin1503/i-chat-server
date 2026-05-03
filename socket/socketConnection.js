
import { Server } from "socket.io";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
export default function socketConnection(server) {
    const io = new Server(server, {
        cors: {
            origin: '*'
        }
    });


    const activeUsers = {};


    io.on("connection", (socket) => {
        console.log('socket from server', socket.id);

        // connected event 
        socket.on("connected", ({ email }) => {
            console.log(email, 'connected');
            activeUsers[email] = socket.id
            socket.emit('connection_msg', `Congratulations your socket id is: ${socket.id}`)
            console.log(activeUsers)
        })


        // recieve message from user 
        socket.on('send-message', async ({ from, message, to, userName, userImage, hasImages, images }) => {
            try {
                let conversation;

                console.log('message from the server', message)

                console.log('sending message to', to, from)

                // check the conversation
                conversation = await Conversation.findOne({
                    participants: {
                        $all: [from, to]
                    }
                });

                if (!conversation) {


                    const conversationCreated = await Conversation.create({
                        participants: [from, to],
                        lastMessage: message || images.length > 0 && `📷 ${images.length} images`,
                        lastSender: from,
                        seenBy: [from],
                    })

                    conversation = conversationCreated;
                    console.log('conversation created', conversationCreated._id)

                    // emit to current user the conversation id
                    socket.emit('conversation-id', {
                        conversationId: conversationCreated._id.toString(),
                        to,
                    })
                } else {
                    await Conversation.findByIdAndUpdate(conversation._id, {
                        $set: {
                            lastMessage: message || images.length > 0 && `📷 ${images.length} images`,
                            lastSender: from,
                            seenBy: [from],
                        }
                    })
                }


                const result = await Message.create({
                    conversationId: conversation._id,
                    sender: from,
                    message: message || '',
                    hasImages,
                    images,
                })


                console.log('result of crate a message', result)



                // emit to reciever
                const recieverSocketId = activeUsers[to];
                if (recieverSocketId) {
                    socket.to(recieverSocketId).emit('recieve-message', {
                        conversationId: conversation._id,
                        from,
                        message: message || '',
                        hasImages,
                        images,
                        createdAt: result.createdAt,
                        messageId: result._id,
                        userImage,
                        userName
                    })
                }

            } catch (error) {
                socket.emit('error', error.message)
            }
        })


        // changge the status of the message to seen
        socket.on('seen-by', async ({ conversationId, userEmail, remoteUserEmail }) => {
            // save to the server that the message has seened
            const result = await Conversation.findByIdAndUpdate(
                conversationId,
                { $addToSet: { seenBy: userEmail } },
                { new: true, timestamps: false }
            );


            // emit to the other user 
            const remoteUserSocketId = activeUsers[remoteUserEmail];

            if (remoteUserSocketId) {
                socket.to(remoteUserSocketId).emit('had-seen', {
                    newSeenBy: userEmail,
                    conversationId,
                });
            }
        })


        // disconnect event
        socket.on("disconnect", () => {
            const email = Object.keys(activeUsers).find(
                (key) => activeUsers[key] === socket.id
            );

            if (email) {
                delete activeUsers[email];
            }

            console.log("disconnected user", socket.id);
        });
    })
}
