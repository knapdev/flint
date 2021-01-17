'use strict';

import Database from './database.js';

//Express
import express from 'express';
import path from 'path';
import http from 'http';

import {Server as IO} from 'socket.io';

import {v4 as UUID} from 'uuid';

import Vector3 from '../shared/math/vector3.js';
import Utils from '../shared/math/utils.js';

import User from '../shared/user.js';

class Server{

    motd = '';

    io = null;

    constructor(){
        this.motd = 'This is the Message Of The Day! Type "/help" for command list.';
    }

    init(){
        // Start express server
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

        // Start socketio server
        this.io = new IO(server);
        this.io.on('connection', (socket) => {
            socket.on('login', (pack) => {
                Database.authorize(pack.username, pack.password, (res) => {
                    if(res == true){
                        let user = new User(UUID(), pack.username, 'global', new Vector3((Math.random() * 20) - 10, 0, (Math.random() * 20) - 10), new Vector3());
                        console.log('User [' + user.name + '] connected!');
            
                        socket.emit('login-response', {
                            success: true
                        });
            
                        socket.emit('user-created', {
                            uuid: user.uuid,
                            name: user.name,
                            room: user.room,
                            position: {
                                x: user.position.x,
                                y: user.position.y,
                                z: user.position.z
                            },
                            rotation: {
                                x: user.rotation.x,
                                y: user.rotation.y,
                                z: user.rotation.z
                            }
                        });
                        socket.on('user-created-res', (pack) => {
                            if(pack.success === true){
                                this.joinRoom(socket, user);
                            }
                        });        
            
                        socket.on('disconnect', () => {
                            this.leaveRoom(socket, user);
            
                            console.log('Client [' + user.name + '] disconnected.');
                            delete User.USERS[user.uuid];
                        });
                    }else{
                        socket.emit('login-response', {
                            success: false
                        });
                    }
                });
            });
        
            socket.on('register', (pack) => {
                Database.registerAccount(pack.username, pack.password, (res) => {
                    socket.emit('register-response', {
                        success: res
                    });
                });
            });
        });
    }

    start(){
        this.init();
        this.run();
    }

    run(){
        const TICK_RATE = 1000 / 20;
        setInterval(() => {
            let pack = [];

            let delta = TICK_RATE / 1000.0;
            for(let u in User.USERS){
                let user = User.USERS[u];
                if(user.is_looking == true){
                    user.rotation.y -= user.look_delta.x * 0.1 * delta;
                    user.rotation.x -= user.look_delta.y * 0.1 * delta;
                    user.rotation.x = Utils.clamp(user.rotation.x, Utils.degToRad(-90), Utils.degToRad(90));
                    user.look_delta.x = 0;
                    user.look_delta.y = 0;
                }

                let vel = new Vector3();
                let pos = user.position;

                if(user.move_input.magnitude() > 0){
                    user.move_input = user.move_input.normalize();
                    vel.x = user.move_input.x * 1 * delta;
                    vel.z = user.move_input.z * 1 * delta;
                }

                user.position = pos.add(vel);
                user.move_input.set(0, 0, 0);

                pack.push({
                    uuid: user.uuid,
                    position: {
                        x: user.position.x,
                        y: user.position.y,
                        z: user.position.z
                    },
                    rotation: {
                        x: user.rotation.x,
                        y: user.rotation.y,
                        z: user.rotation.z
                    }
                });
            }

            this.io.emit('update-users', pack);
        }, TICK_RATE);
    }

    joinRoom(socket, user){
        socket.join(user.room);
    
        socket.emit('join-room', {
            uuid: user.uuid,
            time: new Date().toLocaleTimeString().toLowerCase(),
            username: user.name,
            room: user.room,
            motd: this.motd,
            user_list: User.getUsersInRoom(user.room)
        });
    
        socket.broadcast.to(user.room).emit('user-connected', {
            uuid: user.uuid,
            time: new Date().toLocaleTimeString().toLowerCase(),
            username: user.name,
            room: user.room,
            position: {
                x: user.position.x,
                y: user.position.y,
                z: user.position.z
            },
            rotation: {
                x: user.rotation.x,
                y: user.rotation.y,
                z: user.rotation.z
            }
        });
    
        socket.on('chat-msg', (pack) => {
            this.parseMessage(socket, user, pack.data);
        });
    
        socket.on('set-looking', (pack) => {
            user.is_looking = pack.state;
        });
        socket.on('set-look-delta', (pack) => {
            user.look_delta.x = pack.x;
            user.look_delta.y = pack.y;
        });
    
        socket.on('key-input', (pack) => {
            let move_input = new Vector3();
            if(pack['up'] == true){
                move_input.x -= Math.sin(user.rotation.y);
                move_input.z -= Math.cos(user.rotation.y);
            }
            if(pack['down'] == true){
                move_input.x += Math.sin(user.rotation.y);
                move_input.z += Math.cos(user.rotation.y);
            }
            if(pack['left'] == true){
                move_input.x -= Math.cos(user.rotation.y);
                move_input.z += Math.sin(user.rotation.y);
            }
            if(pack['right'] == true){
                move_input.x += Math.cos(user.rotation.y);
                move_input.z -= Math.sin(user.rotation.y);
            }
            user.move_input.set(move_input.x, 0.0, move_input.z);
        });
    }

    leaveRoom(socket, user){
        this.io.to(user.room).emit('user-disconnected', {
            uuid: user.uuid,
            time: new Date().toLocaleTimeString().toLowerCase()
        });
    
        socket.emit('leave-room', {
        });
    
        socket.removeAllListeners('chat-msg');
        socket.leave(user.room);
        user.room = null;
    }

    parseMessage(socket, user, message){
        if(message.charAt(0) === '/'){
            message = message.substring(1);
    
            let chunks = message.split(' ');
            switch(chunks[0]){
                case 'roll':
                    let num = Number(chunks[1]);
                    if(num == NaN){
                        console.log('not a number');
                        break;
                    }
                    let r = Math.floor(Math.random() * num) + '/' + num;
                    let text = user.name + ' rolls ' + r;
                    this.io.to(user.room).emit('log-event', {
                        time: new Date().toLocaleTimeString().toLowerCase(),
                        text: text
                    });
                    break;
                case 'yell':
                    this.io.to(user.room).emit('log-user-message', {
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
                    this.leaveRoom(socket, user);
                    user.room = chunks[1];
                    this.joinRoom(socket, user);
                    break;
                case 'help':
                    let msg = 'Help:</br>';
                    msg += '/yell message : Yell.</br>';
                    msg += '/who : Show list of users in room.</br>';
                    msg += '/join room_name : Join new room.</br>';
                    msg += '/roll number : Generate a random number between 0 and number.</br>';
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
            this.io.to(user.room).emit('log-user-message', {
                time: new Date().toLocaleTimeString().toLowerCase(),
                name: user.name,
                text: message,
                type: 'normal'
            });
        }
    }

    formatUserMessage(username, str){
        return {
            username: username,
            text: str
        };
    }
}

export default Server;