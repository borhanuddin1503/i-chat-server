import express from 'express';
import DBConnect from './config/DBConnect.js';
import cors from 'cors';
import UserRoutes from './routes/user.routes.js'
import ConversaitonRoutes from './routes/conversation.routes.js'
import MessageRoutes from './routes/message.routes.js'
import { createServer } from "http";
import dotenv from 'dotenv';
import socketConnection from './socket/socketConnection.js';
dotenv.config();


const port = 5000
const app = express()




// middlewares
app.use(cors({
    origin: `${process.env.CLIENT_URL}`,
    credentials: true
}));



app.use(express.json());

// connect DB
await DBConnect();


// routers
app.use('/user', UserRoutes);
app.use('/conversation', ConversaitonRoutes);
app.use('/message', MessageRoutes);


app.get('/', (req, res) => {
    res.send('Hello World!')
})



const server = createServer(app);
socketConnection(server);


server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
