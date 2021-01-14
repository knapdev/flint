'use strict';

// Express
import express from 'express';
let app = express();
import path from 'path';
let __dirname = path.resolve();
app.get('/', function(req, res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
app.use('/shared', express.static(__dirname + '/shared'));

import http from 'http';
let server = http.createServer(app);
server.on('error', (err) => {
    console.error(err);
});
let PORT = process.env.PORT || 8082;
server.listen(PORT, () => {
    console.log('Server running...');
});

// Sockets
import {v4 as UUID} from 'uuid';

import User from './shared/user.js';

let motd = 'This is the Message Of The Day!';
let USERS = {};

let names = [
    'Henry',
    'RedBull420',
    'Marcus',
    "John"
];

import {Server} from 'socket.io';
let io = new Server(server);
io.on('connection', (socket) => {
    let rand = Math.floor(Math.random() * names.length);
    let user = new User(UUID(), socket, names[rand]);

    for(let u in USERS){
        let other = USERS[u];
        other.socket.emit('user-connected', {
            uuid: user.uuid,
            name: user.name
        });
    }
    
    USERS[user.uuid] = user;
    console.log('User [' + user.name + '] connected!');

    let i = 0;
    for(let u in USERS){
        i++;
    }
    socket.emit('connect-success', {
        uuid: user.uuid,
        name: user.name,
        motd: motd,
        user_count: i
    });

    socket.on('chat-msg', (pack) => {
        for(let u in USERS){
            let other = USERS[u];
            other.socket.emit('log-event', {
                name: user.name,
                data: pack.data
            });
        }
    });

    socket.on('disconnect', () => {
        let id = user.uuid;
        let name = user.name;
        console.log('Client [' + user.name + '] disconnected.');
        delete USERS[id];

        for(let u in USERS){
            let other = USERS[u];
            other.socket.emit('user-disconnected', {
                uuid: id,
                name: name
            });
        }
    });
});