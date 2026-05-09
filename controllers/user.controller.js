import User from "../models/user.model.js";
import bcrypt from 'bcrypt'
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken"

export const createUser = async (req, res) => {
    try {
        const userInfo = req.body;
        const { password, ...info } = userInfo;

        const hashedPassword = await bcrypt.hash(password, 10);
        const finalUserInfo = { ...info, hashedPassword };


        // Store hash in your password DB.
        const result = await User.create(finalUserInfo);
        console.log(result)
        if (result._id) {
            return res.status(201).send({
                isSuccess: true,
                result,
            });
        }
        return res.status(500).json({ isSuccess: false })

    }
    catch (error) {
        console.log('error from server', error)

        if (error.code === 11000) {
            return res.status(400).send({
                isSuccess: false,
                message: 'Email already Exists'
            })
        };

        return res.status(500).json({
            isSuccess: false,
            message: error.message,
        });
    }
}




export const getUsers = async (req, res) => {
    try {
        const email = req?.query?.email;
        const id = req?.query?.id;

        let query = {};

        if (email) {
            query.email = email
        }
        if (id) {
            query._id = new ObjectId(id);
        }

        if (Object.keys(query).length !== 0) {
            const user = await User.findOne(query, { name: 1, email: 1, image: 1, role: 1, _id: 1, createdAt: 1 });
            return res.status(200).send({
                isSuccess: true,
                user,
            })
        }


        const users = await User.find({});
        return res.status(200).send({
            isSuccess: true,
            users,
        })


    } catch (error) {
        return res.status(500).send({
            isSuccess: false,
            message: error.message
        })
    }
}




export const logIn = async (req, res) => {
    try {
        const incomingInfo = req.body;
        const email = incomingInfo.email;

        // get data from database
        const userInfo = await User.findOne({ email });

        if (!userInfo) {
            return res.send({
                isSuccess: false,
                message: `${email} does not exists`
            })
        }

        // validate 
        const isPasswordMatched = await bcrypt.compare(incomingInfo.password, userInfo.hashedPassword);

        const { hashedPassword, createdAt, updatedAt, ...safeUser } = userInfo.toObject();
        if (isPasswordMatched) {
            const token = jwt.sign(
                { email: userInfo.email },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );
            return res.send({
                isSuccess: true,
                user: safeUser,
                token,
            })
        }

        return res.send({
            isSuccess: false,
            message: 'Password does not matched'
        })

    } catch (error) {
        return res.send({
            isSuccess: false,
            message: error.message,
        })
    }
}



export const userWithProvider = async (req, res) => {

    try {
        const userInfo = req.body;
        const { email } = userInfo;

        console.log('user info from server', userInfo);

        // check if user exists
        const userFromDb = await User.findOne({ email });

        const token = jwt.sign(
            { email: email },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );


        if (userFromDb) {
            return res.send({
                isSuccess: true,
                message: 'user already exists',
                token,
            })
        }


        // push to database
        const result = await User.create(userInfo);
        res.send({
            isSuccess: true,
            user: result,
            token,
        })
    } catch (error) {
        res.send({
            isSuccess: false,
            message: error.message
        })
    }
}



export const SearchUsers = async (req, res) => {
    const { searchTerm } = req.query;
    try {
        const result = await User.find({
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
            ]
        }, { name: 1, email: 1, image: 1, _id: 1 })

        console.log('search result from server user', result)

        return res.status(200).send({
            isSuccess: true,
            users: result.map(user => ({ ...user.toObject(), isConversation: false }))
        })
    } catch (error) {
        return res.status(500).send({
            isSuccess: false,
            message: error.message
        })
    }
}




export const updateInfo = async (req, res) => {

    const { id } = req.params;
    const body = req.body;

    const name = body?.name;
    const image = body?.image;

    const email = req.decodedEmail;

    try {

        // find user
        const user = await User.findById(id);

        // user not found
        if (!user) {
            return res.status(404).send({
                isSuccess: false,
                message: 'User not found'
            });
        }

        // verify ownership
        if (user.email !== email) {
            return res.status(403).send({
                isSuccess: false,
                message: 'Forbidden access'
            });
        }

        const updatedData = {};

        if (name) {
            updatedData.name = name;
        }

        if (image) {
            updatedData.image = image;
        }

        // update
        const result = await User.findByIdAndUpdate(
            id,
            {
                $set: updatedData
            },
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).send({
            isSuccess: true,
            result
        });

    } catch (error) {

        return res.status(500).send({
            isSuccess: false,
            message: error.message
        });

    }
};