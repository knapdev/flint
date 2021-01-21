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
import Chunk from '../shared/world/chunk.js';
import Coord from '../shared/world/coord.js';

import Noise from '../shared/math/noise.js';

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

        this.noise = new Noise();
        this.noise.seed('dord');

        this.world = new World('The Ancient Dawn');
        for(let y = -32; y < 32; y += 8){
            for(let x = -16; x < 16; x += 8){
                for(let z = -16; z < 16; z += 8){
                    let chunk =  this.generateChunk(this.world, new Coord(x, y, z));
                    this.world.addChunk(chunk);
                }
            }
        }

        // Start socketio server
        this.io = new IO(server);
        this.io.on('connection', (socket) => {
            socket.on('login', (pack) => {
                this.login(pack.username, pack.password, (success) => {
                    if(success == true){

                        let player = new Player(UUID(), this.world, pack.username, 'global', new Vector3((Math.random() * 16), 10, (Math.random() * 10)), new Vector3());
                        console.log('Player [' + player.username + '] connected!');

                        this.world.addPlayer(player);

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
                            if(pack['space'] == true){
                                move_input.y += 1.0;
                            }
                            if(pack['shift'] == true){
                                move_input.y -= 1.0;
                            }
                            player.move_input.set(move_input.x, move_input.y, move_input.z);
                        });

                        socket.on('edit-terrain', (pack) => {
                            let cell = this.world.getCell(player.selectedCoord);
                            if(cell){
                                cell.setTerrain(pack.type);
                                this.io.emit('terrain-changed', {
                                    coord: {
                                        x: player.selectedCoord.x,
                                        y: player.selectedCoord.y,
                                        z: player.selectedCoord.z
                                    },
                                    type: pack.type
                                });
                            }
                        });

                        let chunkDataList = [];
                        for(let c in this.world.chunks){
                            let chunk = this.world.chunks[c];
                            chunkDataList.push(chunk.pack());
                        }

                        let playersInWorld = {};
                        for(let p in this.world.players){
                            let pp = this.world.players[p];

                            playersInWorld[pp.uuid] = pp.pack();
                        }
            
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
                            player_list: playersInWorld,
                            world_name: this.world.name,
                            chunk_data: chunkDataList
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
                            this.world.removePlayer(player.uuid);
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
            for(let u in this.world.players){
                let player = this.world.players[u];
                if(player.is_looking == true){
                    player.rotation.y -= player.look_delta.x * 0.15 * delta;
                    player.rotation.x -= player.look_delta.y * 0.15 * delta;
                    player.rotation.x = Utils.clamp(player.rotation.x, Utils.degToRad(-90), Utils.degToRad(90));
                    player.look_delta.x = 0;
                    player.look_delta.y = 0;
                }

                let vel = new Vector3();
                let pos = player.position;

                if(player.move_input.magnitude() > 0){
                    player.move_input = player.move_input.normalize();
                    vel.x = player.move_input.x * 3 * delta;
                    vel.y = player.move_input.y * 3 * delta;
                    vel.z = player.move_input.z * 3 * delta;
                }

                player.position = pos.add(vel);
                player.move_input.set(0, 0, 0);

                //calculate players selected cell
                let ax = -Math.sin(player.rotation.y);
                let ay = Math.tan(player.rotation.x);
                let az = -Math.cos(player.rotation.y);
                let v = new Vector3(ax, ay, az).normalize();
                let cellCoord = new Vector3(player.getEyePos().x + v.x * 128, player.getEyePos().y + v.y * 128, player.getEyePos().z + v.z * 128);
                let raycastResult = this.world.raytrace(player.getEyePos(), cellCoord);
                if(raycastResult != null && raycastResult.enterPoint != null && raycastResult.normal != null){
                    cellCoord = new Coord(raycastResult.enterPoint.x - raycastResult.normal.x * 0.01, raycastResult.enterPoint.y - raycastResult.normal.y * 0.01, raycastResult.enterPoint.z - raycastResult.normal.z * 0.01);
                }
                player.selectedCoord = cellCoord;

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
                    },
                    selectedCoord: {
                        x: cellCoord.x,
                        y: cellCoord.y,
                        z: cellCoord.z
                    }
                });

                this.io.emit('update-players', pack);

                // let randCoord = new Coord(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), Math.floor(Math.random() * 16));
                // let cell = this.world.getCell(randCoord);
                // if(cell){
                //     let type = null;
                //     if(Math.random() < 0.5){
                //         type = 1;
                //     }
                //     cell.setTerrain(type);
                //     this.io.emit('terrain-changed', {
                //         coord: {
                //             x: randCoord.x,
                //             y: randCoord.y,
                //             z: randCoord.z
                //         },
                //         type: type
                //     });
                // }
            }

            
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

    generateChunk(world, coord){
        let chunk = new Chunk(world, coord);
        for(let y = coord.y; y < coord.y + World.CHUNK_SIZE; y++){
            for(let x = coord.x; x < coord.x + World.CHUNK_SIZE; x++){
                for(let z = coord.z; z < coord.z + World.CHUNK_SIZE; z++){
                    let cellCoord = new Coord(x - coord.x, y - coord.y, z - coord.z);

                    let height = 0;                        
                    height += ((this.noise.simplex3(x / 128, 0, z / 128) + 1.0) / 2.0) * 8;
                    height += ((this.noise.simplex3(x / 16, 0, z / 16) + 1.0) / 2.0) * 4;
                    height += ((this.noise.simplex3(x / 8, 0, z / 8) + 1.0) / 2.0) * 2;

                    height = Math.floor(height);
                    if(y <= height){
                        chunk.getCell(cellCoord).setTerrain(1);
                    }else{
                        chunk.getCell(cellCoord).setTerrain(null);
                    }
                }
            }				
        }
        return chunk;
    }
}

export default Server;