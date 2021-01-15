'use strict';

import express from 'express';
import path from 'path';
import http from 'http';

let app = express();
let __dirname = path.resolve();
app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/shared', express.static(__dirname + '/shared'));

let server = http.createServer(app);
let PORT = process.env.PORT || 8082;
server.on('error', (err) => {
    console.error(err);
});
server.listen(PORT, () => {
    console.log('Server running...');
});

import {Server as IO} from 'socket.io';
import {v4 as UUID} from 'uuid';
import User from './shared/user.js';

let motd = 'This is the Message Of The Day! Type "/help" for command list.';

let io = new IO(server);
io.on('connection', (socket) => {

    socket.on('login', (pack) => {
        let user = new User(UUID(), pack.username, pack.room);
        console.log('User [' + user.name + '] connected!');

        socket.emit('user-created', user);
        socket.on('user-created-res', (pack) => {
            if(pack.success === true){
                joinRoom(socket, user);
            }
        });        

        socket.on('disconnect', () => {
            leaveRoom(socket, user);

            console.log('Client [' + user.name + '] disconnected.');
            delete User.USERS[user.uuid];
        });
    });
});

function joinRoom(socket, user){
    socket.join(user.room);

    socket.emit('join-room', {
        uuid: user.uuid,
        time: new Date().toLocaleTimeString().toLowerCase(),
        username: user.name,
        room: user.room,
        motd: motd,
        user_list: User.getUsersInRoom(user.room)
    });

    socket.broadcast.to(user.room).emit('user-connected', {
        uuid: user.uuid,
        time: new Date().toLocaleTimeString().toLowerCase(),
        username: user.name,
        room: user.room
    });

    socket.on('chat-msg', (pack) => {
        parseMessage(socket, user, pack.data);
    });
}

function leaveRoom(socket, user){
    io.to(user.room).emit('user-disconnected', {
        uuid: user.uuid,
        time: new Date().toLocaleTimeString().toLowerCase()
    });

    socket.emit('leave-room', {
    });

    socket.removeAllListeners('chat-msg');
    socket.leave(user.room);
    user.room = null;
}

function parseMessage(socket, user, message){
    if(message.charAt(0) === '/'){
        message = message.substring(1);

        let chunks = message.split(' ');
        switch(chunks[0]){
            case 'yell':
                io.to(user.room).emit('log-user-message', {
                    time: new Date().toLocaleTimeString().toLowerCase(),
                    name: user.name,
                    text: message.substring(5),
                    type: 'loud'
                });
                break;
            case 'who':
                socket.emit('log-user-list', {
                    time: new Date().toLocaleTimeString().toLowerCase()
                });
                break;
            case 'join':
                leaveRoom(socket, user);
                console.log(chunks[1]);
                user.room = chunks[1];
                joinRoom(socket, user);
                break;
            case 'help':
                let msg = 'Help:</br>';
                msg += '/yell message : Yell.</br>';
                msg += '/who : Show list of users in room.</br>';
                msg += '/join room_name : Join new room.</br>';
                msg += '/help : This help message.</br>';
                socket.emit('log-event', {
                    time: new Date().toLocaleTimeString().toLowerCase(),
                    text: msg
                });

                break;
            default:
                socket.emit('log-event', {
                    time: new Date().toLocaleTimeString().toLowerCase(),
                    text: 'Unknown command: ' + chunks[0]
                });
                break;
        }
    }else{
        io.to(user.room).emit('log-user-message', {
            time: new Date().toLocaleTimeString().toLowerCase(),
            name: user.name,
            text: message,
            type: 'normal'
        });
    }
}

function formatUserMessage(username, str){
    return {
        username: username,
        text: str
    };
}