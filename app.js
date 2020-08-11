
const path = require('path');
const PORT = 3000;
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

//SETUP
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

const chatBotName = 'ChatApp Bot';
//Run when a client connects
io.on('connection', (socket) => {

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //when someone joins the room
        socket.emit('message', formatMessage(chatBotName, 'Welcome to ChatApp!'));

        //broadcast tells everyone else in the room what the user joined
        socket.broadcast.to(user.room).emit('message', formatMessage(chatBotName, `${user.username} has joined the chat`));

        //send users and room info
         io.to(user.room).emit('roomUsers', {
             room: user.room,
             users: getRoomUsers(user.room)
         });
    });

    //listen for chat messages
    socket.on('chatMessage', (msg) => {

        const user = getCurrentUser(socket.id);

        //emit the message received by the server to everyone
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //when a client disconnects io.emit tells the entire chat the message
    socket.on('disconnect', () =>{
        const user = userLeave(socket.id);
        if(user) {
            io.to(user.room).emit('message', formatMessage(chatBotName, `${user.username} has left the chat`));

            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

});

//ROUTES
server.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
})

app.get("/", (req, res) => {
    res.render("index");
})

app.get("/chat", (req, res) => {
    res.render("chat");
})