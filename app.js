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

let motd = 'This is the Message Of The Day!';

let io = new IO(server);
io.on('connection', (socket) => {

    socket.on('join', (pack) => {
        let user = new User(UUID(), pack.username, pack.room);
        console.log('User [' + user.name + '] connected to ' + user.room + '!');

        socket.join(user.room);

        socket.emit('connect-success', {
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

        socket.on('disconnect', () => {
            let id = user.uuid;
            let name = user.name;
            let room = user.room;
            console.log('Client [' + name + '] disconnected.');
            delete User.USERS[id];

            io.to(room).emit('user-disconnected', {
                uuid: id,
                time: new Date().toLocaleTimeString().toLowerCase()
            });
        });
    });
});

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