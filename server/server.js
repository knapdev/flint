'use strict';

import Database from './database.js';

import express from 'express';
import path from 'path';
import http from 'http';
import {Server as IO} from 'socket.io';

import {v4 as UUID} from 'uuid';

import Vector3 from '../shared/math/vector3.js';
import Utils from '../shared/math/utils.js';

import Player from '../shared/player.js';

import World from '../shared/world/world.js';
import Coord from '../shared/world/coord.js';

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

        this.world = new World();
        this.world.registerOnChunkCreatedCallback((chunk) => {
            console.log('Chunk created!');
            //send chunk data to appropriate clients?
        });
        this.world.createChunk(new Coord(0, 0, 0));

        // Start socketio server
        this.io = new IO(server);
        this.io.on('connection', (socket) => {
            socket.on('login', (pack) => {
                this.login(pack.username, pack.password, (success) => {
                    if(success == true){

                        let player = new Player(UUID(), pack.username, 'global', new Vector3((Math.random() * 20) - 10, 0, (Math.random() * 20) - 10), new Vector3());
                        console.log('Player [' + player.username + '] connected!');

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
            
                        socket.emit('login-response', {
                            success: true,
                            uuid: player.uuid,
                            time: new Date().toLocaleTimeString().toLowerCase(),
                            username: player.username,
                            room: player.room,
                            motd: this.motd,
                            position: {
                                x: player.position.x,
                                y: player.position.y,
                                z: player.position.z
                            },
                            rotation: {
                                x: player.rotation.x,
                                y: player.rotation.y,
                                z: player.rotation.z
                            },
                            player_list: Player.getPlayersInRoom(player.room)
                        });

                        socket.broadcast.emit('player-connected', {
                            uuid: player.uuid,
                            time: new Date().toLocaleTimeString().toLowerCase(),
                            username: player.username,
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
                            console.log('msg');
                            this.parseMessage(socket, player, pack.data);
                        });
            
                        socket.on('disconnect', () => {
                            this.io.emit('player-disconnected', {
                                uuid: player.uuid,
                                time: new Date().toLocaleTimeString().toLowerCase()
                            });
            
                            console.log('Player [' + player.username + '] disconnected.');
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
                this.register(pack.username, pack.password, (success) => {
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
                    vel.x = player.move_input.x * 2 * delta;
                    vel.z = player.move_input.z * 2 * delta;
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

    login(username, password, callback){
        Database.authenticate(username, password, (res) => {
            callback(res);
        });
    }

    register(username, password, callback){
        Database.registerAccount(username, password, (res) => {
            callback(res);
        });
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
                    let text = player.username + ' rolls ' + r;
                    this.io.emit('log-event', {
                        time: new Date().toLocaleTimeString().toLowerCase(),
                        text: text
                    });
                    break;
                case 'yell':
                    this.io.emit('log-player-message', {
                        time: new Date().toLocaleTimeString().toLowerCase(),
                        username: player.username,
                        text: message.substring(5),
                        type: 'loud'
                    });
                    break;
                case 'who':
                    socket.emit('log-player-list', {
                        time: new Date().toLocaleTimeString().toLowerCase()
                    });
                    break;
                case 'help':
                    let msg = 'Help:</br>';
                    msg += '/yell message : Yell.</br>';
                    msg += '/who : Show list of players in room.</br>';
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
            this.io.emit('log-player-message', {
                time: new Date().toLocaleTimeString().toLowerCase(),
                username: player.username,
                text: message,
                type: 'normal'
            });
        }
    }
}

export default Server;