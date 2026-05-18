
import { Server } from "socket.io";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
export default function socketConnection(server) {
    const io = new Server(server, {
        cors: {
            origin: '*'
        },
        transports: ['websocket', 'polling']
    });


    const activeUsers = {};


    io.on("connection", (socket) => {
        console.log('socket from server', socket.id);

        // connected event 
        socket.on("connected", ({ email }) => {
            console.log(email, 'connected');
            activeUsers[email] = socket.id
            socket.emit('connection_msg', `Congratulations your socket id is: ${socket.id}`);
            socket.emit('activeUsers', { activeUsers });
            io.emit('user-active', {
                email
            })
            console.log(activeUsers)
        })


        // recieve message from user 
        socket.on('send-message', async ({ from, message, to, userName, userImage, hasImages, images, audio, hasAudio, audioDuration }) => {
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
                        lastMessage:
                            message ||
                            (hasImages && images?.length > 0 && `📷 ${images.length} images`) ||
                            (hasAudio && '🎤 Voice message'),
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
                            lastMessage:
                                message ||
                                (hasImages && images?.length > 0 && `📷 ${images.length} images`) ||
                                (hasAudio && '🎤 Voice message'),
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
                    audio,
                    hasAudio,
                    audioDuration
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
                        audio,
                        hasAudio,
                        audioDuration,
                        createdAt: result.createdAt,
                        _id: result._id,
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


        // handle typing indicator
        socket.on('typing', ({ to, from }) => {
            const receiverSocketId = activeUsers[to];
            if (receiverSocketId) {
                socket.to(receiverSocketId).emit('typing', {
                    from
                })
            }
        })

        // handle typing indicator
        socket.on('stop-typing', ({ to, from }) => {
            const receiverSocketId = activeUsers[to];
            if (receiverSocketId) {
                socket.to(receiverSocketId).emit('stop-typing', {
                    from
                })
            }
        })


        // handle incomming call
        socket.on('create-call', async ({ to, from, type }) => {
            const recieverSocketId = activeUsers[to];
            if (recieverSocketId) {
                socket.to(recieverSocketId).emit('incoming-call', {
                    from,
                    type
                })
            }
        })


        // handle call response
        socket.on('call-response', async ({ to, callRecieved, callType }) => {
            const recieverSocketId = activeUsers[to];
            socket.to(recieverSocketId).emit('call-responded', {
                callRecieved,
                callType
            })
        })


        // handle ice candidate for webrtc
        socket.on('send-candidate', async ({ candidate, to, from }) => {
            const recieverSocketId = activeUsers[to];
            if (recieverSocketId) {
                socket.to(recieverSocketId).emit('receive-candidate', {
                    candidate,
                    from
                })
            }
        })


        // handle get offer and emit to remote user
        socket.on('send-offer', async ({ offer, to, type, from }) => {
            const recieverSocketId = activeUsers[to];

            if (recieverSocketId) {
                socket.to(recieverSocketId).emit('receive-offer', {
                    offer,
                    from,
                    type
                })
            }
        })



        // handle get answers and emit to first user
        socket.on('send-answer', async ({ answer, to, from }) => {
            const recieverSocketId = activeUsers[to];

            if (recieverSocketId) {
                socket.to(recieverSocketId).emit('receive-answer', {
                    answer,
                    from
                })
            }
        })


        // handle end call
        socket.on('end-call', async ({ to, from }) => {
            const recieverId = activeUsers[to];
            if (recieverId) {
                socket.to(recieverId).emit('call-ended', {
                    from,
                })
            }
        })





        // disconnect event
        socket.on("disconnect", () => {
            const email = Object.keys(activeUsers).find(
                (key) => activeUsers[key] === socket.id
            );

            if (email) {
                delete activeUsers[email];
                io.emit('user-inAactive', {
                    email
                })
            }

            console.log("disconnected user", socket.id);
        });
    })
}
