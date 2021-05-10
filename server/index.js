const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users/users');

const PORT = process.env.PORT || 3001;
const app = express();
const router = require('./routes/router');
app.use(cors());
app.use(router);



const options = {
        cors:true,
        origins:['localhost:3000/']
    };
const server = http.createServer(app);

const io = socketio(server, options) 
io.on('connection', (socket) => {
    //socket is going to be connected as a client side socket
    // console.log("new connection made!");


    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });
        console.log(name, room);

        if(error) return callback(error);

        socket.join(user.room);

        socket.emit('message', { user: 'bot', text: `${user.name}, welcome to the room`});
        socket.broadcast.to(user.room).emit('message', { user: 'bot', text: `${user.name}, has joined!`});
        
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

       
        io.to(user.room).emit('message', { user: user.name, text: message });

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user) {
            io.to(user.room).emit('message', { user: 'bot', text: `${user.name} has left.`})
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        }
    });

});



server.listen(PORT, () => 
console.log(`server listening at port ${PORT}`));