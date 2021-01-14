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

let motd = 'This is the Message Of The Day!';
let SOCKETS = {};

import {Server} from 'socket.io';
let io = new Server(server);
io.on('connection', (socket) => {
    socket.uuid = UUID();

    for(let s in SOCKETS){
        let other = SOCKETS[s];
        other.emit('user-connected', {
            data: socket.uuid
        });
    }

    SOCKETS[socket.uuid] = socket;
    console.log('Client [' + socket.uuid + '] connected!');

    let i = 0;
    for(let s in SOCKETS){
        i++;
    }
    socket.emit('connect-success', {
        uuid: socket.uuid,
        motd: motd,
        user_count: i
    });

    socket.on('chat-msg', (pack) => {
        for(let s in SOCKETS){
            let other = SOCKETS[s];
            other.emit('log-event', {
                uuid: socket.uuid,
                data: pack.data
            });
        }
    });

    socket.on('disconnect', () => {
        let id = socket.uuid;
        console.log('Client [' + id + '] disconnected.');
        delete SOCKETS[id];

        for(let s in SOCKETS){
            let other = SOCKETS[s];
            other.emit('user-disconnected', {
                data: id
            });
        }
    });
});