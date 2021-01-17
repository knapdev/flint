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

import Player from '../shared/player.js';

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
                Database.authenticate(pack.username, pack.password, (res) => {
                    if(res == true){
                        let player = new Player(UUID(), pack.username, 'global', new Vector3((Math.random() * 20) - 10, 0, (Math.random() * 20) - 10), new Vector3());
                        console.log('Player [' + player.name + '] connected!');
            
                        socket.emit('login-response', {
                            success: true
                        });
            
                        socket.emit('player-created', {
                            uuid: player.uuid,
                            name: player.name,
                            room: player.room,
                            position: {
                                x: player.position.x,
                                y: player.position.y,
                                z: player.position.z
                            },
                            rotation: {
                                x: player.rotation.x,
                                y: player.rotation.y,
                                z: player.rotation.z
                            }
                        });
                        socket.on('player-created-res', (pack) => {
                            if(pack.success === true){
                                this.joinRoom(socket, player);
                            }
                        });        
            
                        socket.on('disconnect', () => {
                            this.leaveRoom(socket, player);
            
                            console.log('Player [' + player.name + '] disconnected.');
                            delete Player.PLAYERS[player.uuid];
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
            for(let u in Player.PLAYERS){
                let player = Player.PLAYERS[u];
                if(player.is_looking == true){
                    player.rotation.y -= player.look_delta.x * 0.1 * delta;
                    player.rotation.x -= player.look_delta.y * 0.1 * delta;
                    player.rotation.x = Utils.clamp(player.rotation.x, Utils.degToRad(-90), Utils.degToRad(90));
                    player.look_delta.x = 0;
                    player.look_delta.y = 0;
                }

                let vel = new Vector3();
                let pos = player.position;

                if(player.move_input.magnitude() > 0){
                    player.move_input = player.move_input.normalize();
                    vel.x = player.move_input.x * 1 * delta;
                    vel.z = player.move_input.z * 1 * delta;
                }

                player.position = pos.add(vel);
                player.move_input.set(0, 0, 0);

                pack.push({
                    uuid: player.uuid,
                    position: {
                        x: player.position.x,
                        y: player.position.y,
                        z: player.position.z
                    },
                    rotation: {
                        x: player.rotation.x,
                        y: player.rotation.y,
                        z: player.rotation.z
                    }
                });
            }

            this.io.emit('update-players', pack);
        }, TICK_RATE);
    }

    joinRoom(socket, player){
        socket.join(player.room);
    
        socket.emit('join-room', {
            uuid: player.uuid,
            time: new Date().toLocaleTimeString().toLowerCase(),
            username: player.name,
            room: player.room,
            motd: this.motd,
            player_list: Player.getPlayersInRoom(player.room)
        });
    
        socket.broadcast.to(player.room).emit('player-connected', {
            uuid: player.uuid,
            time: new Date().toLocaleTimeString().toLowerCase(),
            username: player.name,
            room: player.room,
            position: {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z
            },
            rotation: {
                x: player.rotation.x,
                y: player.rotation.y,
                z: player.rotation.z
            }
        });
    
        socket.on('chat-msg', (pack) => {
            this.parseMessage(socket, player, pack.data);
        });
    
        socket.on('set-looking', (pack) => {
            player.is_looking = pack.state;
        });
        socket.on('set-look-delta', (pack) => {
            player.look_delta.x = pack.x;
            player.look_delta.y = pack.y;
        });
    
        socket.on('key-input', (pack) => {
            let move_input = new Vector3();
            if(pack['up'] == true){
                move_input.x -= Math.sin(player.rotation.y);
                move_input.z -= Math.cos(player.rotation.y);
            }
            if(pack['down'] == true){
                move_input.x += Math.sin(player.rotation.y);
                move_input.z += Math.cos(player.rotation.y);
            }
            if(pack['left'] == true){
                move_input.x -= Math.cos(player.rotation.y);
                move_input.z += Math.sin(player.rotation.y);
            }
            if(pack['right'] == true){
                move_input.x += Math.cos(player.rotation.y);
                move_input.z -= Math.sin(player.rotation.y);
            }
            player.move_input.set(move_input.x, 0.0, move_input.z);
        });
    }

    leaveRoom(socket, player){
        this.io.to(player.room).emit('player-disconnected', {
            uuid: player.uuid,
            time: new Date().toLocaleTimeString().toLowerCase()
        });
    
        socket.emit('leave-room', {
        });
    
        socket.removeAllListeners('chat-msg');
        socket.leave(player.room);
        player.room = null;
    }

    parseMessage(socket, player, message){
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
                    let text = player.name + ' rolls ' + r;
                    this.io.to(player.room).emit('log-event', {
                        time: new Date().toLocaleTimeString().toLowerCase(),
                        text: text
                    });
                    break;
                case 'yell':
                    this.io.to(player.room).emit('log-player-message', {
                        time: new Date().toLocaleTimeString().toLowerCase(),
                        name: player.name,
                        text: message.substring(5),
                        type: 'loud'
                    });
                    break;
                case 'who':
                    socket.emit('log-player-list', {
                        time: new Date().toLocaleTimeString().toLowerCase()
                    });
                    break;
                case 'join':
                    this.leaveRoom(socket, player);
                    player.room = chunks[1];
                    this.joinRoom(socket, player);
                    break;
                case 'help':
                    let msg = 'Help:</br>';
                    msg += '/yell message : Yell.</br>';
                    msg += '/who : Show list of players in room.</br>';
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
            this.io.to(player.room).emit('log-player-message', {
                time: new Date().toLocaleTimeString().toLowerCase(),
                name: player.name,
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