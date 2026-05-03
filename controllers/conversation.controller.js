import Conversation from "../models/conversation.model.js"
import { ObjectId } from "mongodb";
import User from "../models/user.model.js";

export const getConversationWithUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('id from conversation route', id);

    const result = await Conversation.aggregate([
      {
        $match: {
          _id: new ObjectId(id)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: "participants",
          foreignField: "email",
          as: "participantsInfo"
        }
      },
      {
        $project: {
          _id: 1,
          participants: 1,
          lastMessage: 1,
          lastSender: 1,
          seenBy: 1,
          createdAt: 1,
          updatedAt: 1,
          "participantsInfo.name": 1,
          "participantsInfo.email": 1,
          "participantsInfo.image": 1
        }
      }
    ])

    console.log('aggregate result from server', result);

    res.status(200).send({
      isSuccess: true,
      conversationInfo: result,
    })
  } catch (error) {
    res.status(500).send({
      isSuccess: false,
      message: error.message
    })
  }
}






export const getConversations = async (req, res) => {
  try {
    const { email } = req.query;
    const { decodedEmail } = req;

    if (email === decodedEmail) {
      const conversations = await Conversation.aggregate([
        {
          $match: {
            participants: {
              $in: [email]
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: "participants",
            foreignField: "email",
            as: "participantsInfo"
          }
        },
        {
          $project: {
            _id: 1,
            participants: 1,
            lastMessage: 1,
            lastSender: 1,
            seenBy: 1,
            createdAt: 1,
            updatedAt: 1,
            "participantsInfo.name": 1,
            "participantsInfo.email": 1,
            "participantsInfo.image": 1
          }
        },
        {
          $sort: {
            updatedAt: -1
          }
        }
      ])
      return res.status(200).send({
        isSuccess: true,
        conversations
      });
    }


    return res.status(403).send({
      isSuccess: false,
      message: 'Forbidden'
    })

  } catch (error) {
    return res.status(500).send({
      isSuccess: false,
      message: error.message
    });
  }
}




// search
export const searchConversations = async (req, res) => {
  try {
    const { searchTerm = '' } = req.query;
    const { decodedEmail: email } = req;

    const conversations = await Conversation.aggregate([
      {
        $match: {
          participants: { $in: [email] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: "participants",
          foreignField: "email",
          as: "participantsInfo"
        }
      },
      {
        $unwind: "$participantsInfo"
      },
      {
        $match: {
          "participantsInfo.email": { $ne: email },
          $or: [
            { "participantsInfo.name": { $regex: searchTerm, $options: 'i' } },
            { "participantsInfo.email": { $regex: searchTerm, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          "participantsInfo.name": 1,
          "participantsInfo.email": 1,
          "participantsInfo.image": 1
        }
      }
    ]);

    console.log('search result from server conversation', conversations);

    return res.status(200).send({
      isSuccess: true,
      conversations: conversations.map(c => ({
        _id: c._id,
        name: c.participantsInfo?.name,
        email: c.participantsInfo?.email,
        image: c.participantsInfo?.image,
        isConversation: true
      }))
    });

  } catch (error) {
    return res.status(500).send({
      isSuccess: false,
      message: error.message
    });
  }
};