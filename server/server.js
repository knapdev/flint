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
import ActionEat from '../shared/action/action_eat.js';
import ActionMine from '../shared/action/action_mine.js';
import ActionPlace from '../shared/action/action_place.js';

class Server{

    motd = '';

    io = null;
    SOCKETS = {};

    constructor(){
        this.motd = 'This is the Message Of The Day! Type "/help" for command list.';
    }

    init(){
        this.createWorld();
        this.connect();
    }

    connect(){
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
            socket.uuid = UUID();
            this.SOCKETS[socket.uuid] = socket;

            socket.on('login', (pack) => {
                this.onLogin(socket.uuid, pack);
            });
        
            socket.on('register', (pack) => {
                this.onRegister(socket.uuid, pack);
            });

            socket.on('set-looking', (pack) => {
                this.onSetLooking(socket.uuid, pack);
            });

            socket.on('set-look-delta', (pack) => {
                this.onSetLookDelta(socket.uuid, pack);
            });

            socket.on('key-input', (pack) => {
                this.onKeyInput(socket.uuid, pack);
            });

            socket.on('terrain-remove', (pack) => {
                this.onTerrainRemoved(socket.uuid, pack);
            });

            socket.on('terrain-add', (pack) => {
                this.onTerrainAdded(socket.uuid, pack);
            });

            socket.on('chat-msg', (pack) => {
                this.parseMessage(socket.uuid, pack);
            });

            socket.on('queue-action', (pack) => {
                this.onQueueAction(socket.uuid, pack);
            });

            socket.on('disconnect', () => {
                delete this.SOCKETS[socket.uuid];

                this.onDisconnect(socket.uuid);
            });
        });
    }

    start(){
        this.init();
        this.run();
    }

    run(){
        const TICK_RATE = 1000 / 60;
        setInterval(() => {
            let pack = [];

            let delta = TICK_RATE / 1000.0;
            for(let u in this.world.players){
                let player = this.world.players[u];
                player.tick(delta);

                if(player.position.y < 0){
                    player.position.y = 36;
                    player.position.x = 16.5;
                    player.position.z = 16.5;
                    player.velocity.y = 0;
                }

                let selected = null;
                if(player.selectedCoordInside != null){
                    selected = {
                        x: player.selectedCoordInside.x,
                        y: player.selectedCoordInside.y,
                        z: player.selectedCoordInside.z
                    };
                }

                let selectedOut = null;
                if(player.selectedCoordOutside != null){
                    selectedOut = {
                        x: player.selectedCoordOutside.x,
                        y: player.selectedCoordOutside.y,
                        z: player.selectedCoordOutside.z
                    };
                }

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
                    velocity: {
                        x: player.velocity.x,
                        y: player.velocity.y,
                        z: player.velocity.z,
                    },
                    selectedCoordInside: selected,
                    selectedCoordOutside: selectedOut
                });

                this.io.emit('update-players', pack);
            }            
        }, TICK_RATE);
    }

    createWorld(){
        this.noise = new Noise();
        this.noise.seed('drod');

        this.world = new World('The Ancient Dawn');
        for(let y = 0; y < 64; y += 8){
            for(let x = 0; x < 32; x += 8){
                for(let z = 0; z < 32; z += 8){
                    let chunk =  this.generateChunk(this.world, new Coord(x, y, z));
                    this.world.addChunk(chunk);
                }
            }
        }
    }

    onLogin(socketUUID, pack){
        Database.authenticate(pack.username, pack.password, (success) => {
            console.log(success);
            if(success == true){

                let player = new Player(socketUUID, this.world, pack.username, 'global', new Vector3(16.5, 36, 16.5), new Vector3());
                console.log('Player [' + player.username + '] connected!');

                this.world.addPlayer(player);
    
                let socket = this.SOCKETS[socketUUID];
                socket.emit('login-response', {
                    success: true,
                    motd: this.motd,
                    uuid: player.uuid,
                    world: this.world.pack()                    
                });

                socket.broadcast.emit('player-connected', {
                    player: player.pack()
                });                
            }else{
                socket.emit('login-response', {
                    success: false
                });
            }
        });
    }

    onRegister(socketUUID, pack){
        Database.registerAccount(pack.username, pack.password, (success) => {
            this.SOCKETS[socketUUID].emit('register-response', {
                success: success
            });
        });
    }

    parseMessage(socketUUID, pack){
        let socket = this.SOCKETS[socketUUID];
        let player = this.world.getPlayer(socketUUID);
        let message = pack.data;
        if(message.charAt(0) === '/'){
            message = message.substring(1);
    
            let chunks = message.split(' ');
            switch(chunks[0]){
                case 'roll':
                    let num = Number(chunks[1]);
                    if(isNaN(num)){
                        num = 100;
                    }
                    let r = Math.floor(Math.random() * num) + '/' + num;
                    let text = '<span class="eventlog-username">' + player.username + '</span> rolls ' + r;
                    this.io.emit('log-event', {
                        text: text
                    });
                    break;
                case 'yell':
                    this.io.emit('log-player-message', {
                        username: player.username,
                        text: message.substring(5),
                        type: 'loud'
                    });
                    break;
                case 'who':
                    socket.emit('log-player-list', {
                    });
                    break;
                case 'help':
                    let msg = 'Help:</br>';
                    msg += '/yell message : Yell.</br>';
                    msg += '/who : Show list of players in room.</br>';
                    msg += '/roll number : Generate a random number between 0 and number.</br>';
                    msg += '/help : This help message.</br>';
                    socket.emit('log-event', {
                        text: msg
                    });
                    break;
                default:
                    socket.emit('log-event', {
                        text: 'Unknown command: ' + chunks[0]
                    });
                    break;
            }
        }else{
            this.io.emit('log-player-message', {
                username: player.username,
                text: message,
                type: 'normal'
            });
        }
    }

    onKeyInput(socketUUID, pack){
        let player = this.world.getPlayer(socketUUID);

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
            player.jump();
        }
        player.move_input.set(move_input.x, move_input.y, move_input.z);
    }

    onTerrainAdded(socketUUID, pack){
        let player = this.world.getPlayer(socketUUID);
        let coord = player.selectedCoordOutside;
        if(player){
            let placeAction = new ActionPlace(player, this.world, coord, 5);
            placeAction.on('started', () => {
                this.SOCKETS[socketUUID].emit('action-queued', {
                });
                this.io.emit('log-event', {
                    text: '<span class="eventlog-username">' + player.username + '</span> started placing.'
                });
            });
            placeAction.on('progress', (progress) => {
                this.SOCKETS[socketUUID].emit('action-progress', {
                    progress: progress,
                    duration: 5
                });
            });
            placeAction.on('completed', () => {
                this.SOCKETS[socketUUID].emit('action-completed', {
                });
                this.io.emit('terrain-changed', {
                    playerUUID: player.uuid,
                    coord: {
                        x: coord.x,
                        y: coord.y,
                        z: coord.z
                    },
                    type: 1
                });
            });
            placeAction.on('cancelled', () => {
                this.SOCKETS[socketUUID].emit('action-cancelled', {
                    text: 'You cancelled placing.'
                });
            });
            player.addActionToQueue(placeAction);
        }
    }

    onTerrainRemoved(socketUUID, pack){
        let player = this.world.getPlayer(socketUUID);
        let coord = player.selectedCoordInside;
        if(player){
            let mineAction = new ActionMine(player, this.world, coord, 5);
            mineAction.on('started', () => {
                this.SOCKETS[socketUUID].emit('action-queued', {
                });
                this.io.emit('log-event', {
                    text: '<span class="eventlog-username">' + player.username + '</span> started mining.'
                });
            });
            mineAction.on('progress', (progress) => {
                this.SOCKETS[socketUUID].emit('action-progress', {
                    progress: progress,
                    duration: 5
                });
            });
            mineAction.on('completed', () => {
                this.SOCKETS[socketUUID].emit('action-completed', {
                });
                this.io.emit('terrain-changed', {
                    playerUUID: player.uuid,
                    coord: {
                        x: coord.x,
                        y: coord.y,
                        z: coord.z
                    },
                    type: null
                });
            });
            mineAction.on('cancelled', () => {
                this.SOCKETS[socketUUID].emit('action-cancelled', {
                    text: 'You cancelled mining.'
                });
            });
            player.addActionToQueue(mineAction);
        }
    }

    onSetLooking(socketUUID, pack){
        let player = this.world.getPlayer(socketUUID);
        if(player) player.is_looking = pack.state;
    }

    onSetLookDelta(socketUUID, pack){
        let player = this.world.getPlayer(socketUUID);
        if(player){
            player.look_delta.x = pack.x;
            player.look_delta.y = pack.y;
        }
    }

    onQueueAction(socketUUID, pack){
        let player = this.world.getPlayer(socketUUID);
        if(player){
            let eatAction = new ActionEat(player, 3);
            eatAction.on('started', () => {
                this.SOCKETS[socketUUID].emit('action-queued', {
                    text: 'You start eating.'
                });
            });
            eatAction.on('progress', (progress) => {
                this.SOCKETS[socketUUID].emit('action-progress', {
                    progress: progress,
                    duration: 3
                });
            });
            eatAction.on('completed', () => {
                this.SOCKETS[socketUUID].emit('action-completed', {
                    text: 'You finish eating. *BURP*'
                });
            });
            eatAction.on('cancelled', () => {
                this.SOCKETS[socketUUID].emit('action-completed', {
                    text: 'You cancelled eating.'
                });
            });
            player.addActionToQueue(eatAction);
        }
    }

    onDisconnect(socketUUID){
        let player = this.world.getPlayer(socketUUID);
        if(player){
            this.io.emit('player-disconnected', {
                uuid: player.uuid,
            });

            console.log('Player [' + player.username + '] disconnected.');
            this.world.removePlayer(player.uuid);
        }
    }

    generateChunk(world, coord){
        let chunk = new Chunk(world, coord);
        for(let y = coord.y; y < coord.y + World.CHUNK_SIZE; y++){
            for(let x = coord.x; x < coord.x + World.CHUNK_SIZE; x++){
                for(let z = coord.z; z < coord.z + World.CHUNK_SIZE; z++){
                    let cellCoord = new Coord(x - coord.x, y - coord.y, z - coord.z);

                    let height = 0;                        
                    height += ((this.noise.simplex3(x / 512, 0, z / 512) + 1.0) / 2.0) * 16;
                    height += ((this.noise.simplex3(x / 32, 0, z / 32) + 1.0) / 2.0) * 12;
                    height += ((this.noise.simplex3(x / 16, 0, z / 16) + 1.0) / 2.0) * 8;

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