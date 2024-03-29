'use strict';

import Renderer from './graphics/renderer.js';
import Shader from './graphics/shader.js';
import Mesh from './graphics/mesh.js';
import Texture from './graphics/texture.js';
import Geometry from './graphics/geometry.js';

import Matrix4 from '../../shared/math/matrix4.js';
import Vector3 from '../../shared/math/vector3.js';

import Keyboard from './input/keyboard.js';
import Mouse from './input/mouse.js';

import World from '../../shared/world/world.js';
import WorldRenderer from './worldrenderer.js';
import Coord from '../../shared/world/coord.js';

import Player from '../../shared/player.js';
import Utils from '../../shared/math/utils.js';
import Chunk from '../../shared/world/chunk.js';

import Stats from './utils/stats.js';

import AABB from '../../shared/physics/aabb.js';
import EventLog from './ui/eventlog.js';


class Client{

    renderer = null;
    shader = null;

    mesh = null;
    head_mesh = null;

    texture = null;
    guy_texture = null;
    grass_texture = null;
    crate_texture = null;
    selection_texture = null;
    white_texture = null;
    tiles_texture = null;

    bg_sound = null;
    boop_sound = null;
    
    socket = null;
    uuid = null;

    world = null;
    worldRenderer = null;

    then = 0.0;
    frame_id = null;

    renderWorld = true;

    stats = null;
    eventLog = null;

    actionTimerBar = null;

    constructor(config){
        this.actionTimerBar = document.getElementById('action-timer-back');
        this.actionTimerBar.style.visibility = 'hidden';
    }

    connect(){
        this.socket = io();

        let login_button = document.getElementById('login-button');
        login_button.addEventListener('click', (evnt) => {
            this.login();
        });

        let register_button = document.getElementById('register-button');
        register_button.addEventListener('click', (evnt) => {
            this.register();
        });
    }

    start(pack){
        console.log('Client started.');
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        
        this.initRenderer();
        this.loadAssets();
        this.initWorld(pack.world);

        this.uuid = pack.uuid;
        let player = this.world.getPlayer(this.uuid);

        this.eventLog = new EventLog();
        this.eventLog.setHeaderText(player.room);
        this.eventLog.displayWelcomeMessage(player);
        this.eventLog.addEntryToLog({text: pack.motd});
        this.eventLog.logUserList(this.world.players);

        this.socket.on('player-connected', (pack) => {
            this.onPlayerConnected(pack);
        });

        this.socket.on('player-disconnected', (pack) => {
            this.onPlayerDisconnected(pack);
        });

        this.socket.on('update-players', (pack) => {
            this.onUpdatePlayers(pack);
        });

        this.socket.on('terrain-changed', (pack) => {
            this.onTerrainChanged(pack);
        });

        this.socket.on('log-player-message', (pack) => {
            this.eventLog.logUserMessage(pack);
        });
    
        this.socket.on('log-event', (pack) => {
            this.eventLog.logEvent(pack);
        });

        this.socket.on('log-player-list', (pack) => {
            this.eventLog.logUserList(this.world.players);
        });

        this.socket.on('action-queued', (pack) => {
            // this.eventLog.addEntryToLog({
            //     text: pack.text
            // });
            this.actionTimerBar.style.visibility = 'visible';
            document.getElementById('action-timer').style.width = 0 + 'px';
        });

        this.socket.on('action-progress', (pack) => {
            document.getElementById('action-timer').style.width = (pack.progress / pack.duration) * 100 + '%';
        });

        this.socket.on('action-completed', (pack) => {
            // this.eventLog.addEntryToLog({
            //     text: pack.text
            // });
            this.actionTimerBar.style.visibility = 'hidden';
        });

        this.socket.on('action-cancelled', (pack) => {
            this.eventLog.addEntryToLog({
                text: pack.text
            });
            this.actionTimerBar.style.visibility = 'hidden';
        });
        
        let input = document.getElementById('eventlog-input');
        input.addEventListener('keyup', (evnt) => {
            if(evnt.keyCode == 13){
                if(input.value.length != 0){
                    this.socket.emit('chat-msg', {
                        data: input.value.toString()
                    });
                }
                input.value = '';
                input.blur();
            }
        });

        Mouse._init();

        this.then = performance.now();
        this.frame_id = requestAnimationFrame(this.run.bind(this));
    }

    run(now){
        let delta = (now - this.then) / 1000.0;
        let fps = (1.0 / delta);

        this.stats.begin();

        this.update(delta);
        this.render();

        this.stats.end();

        this.then = now;
        this.frame_id = requestAnimationFrame(this.run.bind(this));
    }

    update(delta){
        Keyboard._update();

        let player = this.world.getPlayer(this.uuid);

        if(document.body === document.activeElement){
            let key_input = {
                up: false,
                down: false,
                left: false,
                right: false,
                space: false
            };
            if(Keyboard.getKey(Keyboard.KeyCode.W)){
                key_input['up'] = true;
            }
            if(Keyboard.getKey(Keyboard.KeyCode.S)){
                key_input['down'] = true;
            }
            if(Keyboard.getKey(Keyboard.KeyCode.A)){
                key_input['left'] = true;
            }
            if(Keyboard.getKey(Keyboard.KeyCode.D)){
                key_input['right'] = true;
            }
            if(Keyboard.getKeyDown(Keyboard.KeyCode.SPACE)){
                key_input['space'] = true;
                //player.jump();
            }
            
            if(key_input['up'] == true || key_input['down'] == true || key_input['left'] == true || key_input['right'] == true || key_input['space'] == true){
                this.socket.emit('key-input', key_input);
            }

            if(Mouse.getButtonDown(Mouse.Button.LEFT)){
                this.renderer.canvas.requestPointerLock();
                this.socket.emit('set-looking', {
                    state: true
                });
                player.is_looking = true;
            }

            if(Mouse.getButtonUp(Mouse.Button.LEFT)){
                document.exitPointerLock();
                this.socket.emit('set-looking', {
                    state: false
                });
                player.is_looking = false;
            }

            if(Mouse.getButtonDown(Mouse.Button.MIDDLE)){
                this.socket.emit('terrain-remove', {});
            }

            if(Mouse.getButtonDown(Mouse.Button.RIGHT)){
                this.socket.emit('terrain-add', {});
            }

            if(Mouse.getMovement()){
                this.socket.emit('set-look-delta', {
                    x: Mouse.delta.x,
                    y: Mouse.delta.y
                });
                
                player.look_delta.x = Mouse.delta.x;
                player.look_delta.y = Mouse.delta.y;
                player.look(delta);
            }

            if(Keyboard.getKeyDown(Keyboard.KeyCode.Z)){
                this.renderWorld = !this.renderWorld;
            }

            if(Keyboard.getKeyDown(Keyboard.KeyCode.E)){
                console.log('hmm');
                this.socket.emit('queue-action', {});
            }
        }


        Mouse._update();
    }

    render(){
        this.renderer.clear();

        this.renderer.shader.bind();        

        let player = this.world.getPlayer(this.uuid);
        this.renderer.setCamera(new Vector3(player.position.x, player.position.y + 0.5, player.position.z), player.rotation);

        this.renderer.setTexture(this.tiles_texture);
        if(this.renderWorld){
            this.worldRenderer.render();
        }
        
        if(player.selectedCoordInside !== null){
            this.renderer.setTexture(this.selection_texture);
            {
                let matrix = Matrix4.create();
                matrix = Matrix4.translate(matrix, player.selectedCoordInside.x + 0.5, player.selectedCoordInside.y + 0.5, player.selectedCoordInside.z + 0.5);
                matrix = Matrix4.scale(matrix, 1.01, 1.01, 1.01);
                this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                this.renderer.drawMesh(this.mesh);
            }
        }

        for(let u in this.world.players){
            let other = this.world.players[u];
            if(other != null && other.uuid != this.uuid){
                //Head
                this.renderer.setTexture(this.guy_texture);
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.25, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.rotateX(matrix, other.rotation.x);
                    matrix = Matrix4.translate(matrix, 0.0, 0.25, 0.0);
                    matrix = Matrix4.scale(matrix, 0.4, 0.4, 0.4);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.head_mesh);
                }

                this.renderer.setTexture(this.texture);
                //Torso
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.225, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.scale(matrix, 0.32, 0.15, 0.2);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.mesh);
                }
                //Left Arm
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.225, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.translate(matrix, -0.21, 0, 0);
                    matrix = Matrix4.scale(matrix, 0.1, 0.15, 0.1);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.mesh);
                }
                //Right Arm
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.225, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.translate(matrix, 0.21, 0, 0);
                    matrix = Matrix4.scale(matrix, 0.1, 0.15, 0.1);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.mesh);
                }
                //Left Leg
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.1, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.translate(matrix, -0.07, 0, 0);
                    matrix = Matrix4.scale(matrix, 0.12, 0.2, 0.12);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.mesh);
                }
                //Right leg
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.1, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.translate(matrix, 0.07, 0, 0);
                    matrix = Matrix4.scale(matrix, 0.12, 0.2, 0.12);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.mesh);
                }
                //Backpack
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.22, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.translate(matrix, 0, 0, 0.14);
                    matrix = Matrix4.scale(matrix, 0.2, 0.1, 0.08);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.mesh);
                }

                //aabb
                let aabb = new AABB(new Vector3(other.position.x - 0.25, other.position.y, other.position.z - 0.25),
                                new Vector3(other.position.x + 0.25, other.position.y + 0.75, other.position.z + 0.25));
                this.renderer.drawAABB(aabb);
            }
        }

        // UI (SLOW!!! Should only update when the player actually changes coords!)
        document.getElementById('coords').innerText = 'C - ' +
            'x:' + Math.floor(player.position.x) +
            ' y:' + Math.floor(player.position.y) +
            ' z:' + Math.floor(player.position.z);

        if(player.selectedCoordInside !== null){
            document.getElementById('selected-inside').innerText = 'SI - ' + 
                'x:' + Math.floor(player.selectedCoordInside.x) +
                ' y:' + Math.floor(player.selectedCoordInside.y) +
                ' z:' + Math.floor(player.selectedCoordInside.z);
        }else{
            document.getElementById('selected-inside').innerText = '';
        }
        if(player.selectedCoordOutside !== null){
            document.getElementById('selected-outside').innerText = 'SO - ' + 
                'x:' + Math.floor(player.selectedCoordOutside.x) +
                ' y:' + Math.floor(player.selectedCoordOutside.y) +
                ' z:' + Math.floor(player.selectedCoordOutside.z);
        }else{
            document.getElementById('selected-outside').innerText = '';
        }
    }

    initRenderer(){
        this.renderer = new Renderer('canvas', 'game-screen');

        this.shader = new Shader(this.renderer.getContext(), vertShaderSourceString, fragShaderSourceString);
        this.renderer.setShader(this.shader);
        window.addEventListener('resize', (evnt) => {
            this.renderer.resize();
        });
        this.renderer.resize();

        this.renderer.setPerspective(60.0, 0.01, 256.0);
        //this.renderer.setClearColor(0.05, 0.05, 0.1, 1.0);
        this.renderer.setClearColor(0.60, 0.80, 0.95);
        //this.renderer.setClearColor(0.99, 0.70, 0.70);

        this.stats = new Stats();
        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
    }

    loadAssets(){
        this.mesh = Geometry.generateMesh(this.renderer.getContext(), Geometry.PrimitiveType.CUBE);//generateMesh(this.renderer.getContext());
        this.head_mesh = generateHeadMesh(this.renderer.getContext());

        Texture.load(this.renderer.getContext(), '/client/res/textures/test.png', (texture) => {
            this.texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/guy.png', (texture) => {
            this.guy_texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/grass.png', (texture) => {
            this.grass_texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/crate.png', (texture) => {
            this.crate_texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/selection.png', (texture) => {
            this.selection_texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/white.png', (texture) => {
            this.white_texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/tiles.png', (texture) => {
            this.tiles_texture = texture;
        });

        this.bg_sound = new Audio();
		this.bg_sound.src = 'client/res/sounds/bg.mp3';
		this.bg_sound.volume = 0.25;
		this.bg_sound.loop = true;
        
        this.boop_sound = new Audio();
		this.boop_sound.src = 'client/res/sounds/boop.mp3';
        this.boop_sound.volume = 0.25;
    }

    initWorld(worldPack){
        this.world = new World(worldPack.name);
        this.world.unpack(worldPack);

        this.world.on('player-added', (player) => {
            this.eventLog.addEntryToLog({
                text: '<span class="eventlog-username">' + player.username + '</span> connected!'
            });
        });
        this.world.on('player-removed', (player) => {
            this.eventLog.addEntryToLog({
                text: '<span class="eventlog-username">' + player.username + '</span> disconnected!'
            });
        });

        this.worldRenderer = new WorldRenderer(this.world, this.renderer);
        for(let c in this.world.chunks){
            let chunk = this.world.chunks[c];
            this.worldRenderer.onChunkCreated(chunk);
        }
    }

    login(){
        let username = document.getElementById('login-username');
        let password = document.getElementById('login-password');
        
        this.socket.emit('login', {
            username: username.value,
            password: password.value
        });

        this.socket.once('login-response', (pack) => {
            if(pack.success == true){
                this.start(pack);
            }else{
                document.getElementById('login-alert').innerText = 'Login unsuccessful. Try again.';
                username.value = '';
                password.value = '';
            }
        });
    }

    register(){
        let username = document.getElementById('login-username');
        let password = document.getElementById('login-password');

        this.socket.emit('register', {
            username: username.value,
            password: password.value
        });

        this.socket.once('register-response', (pack) => {
            if(pack.success == true){
                document.getElementById('login-alert').innerText = 'Registration successful. Please login.';
                username.value = '';
                password.value = '';
            }else{
                document.getElementById('login-alert').innerText = 'Username taken.';
                username.value = '';
                password.value = '';
            }
        });
    }

    onPlayerConnected(pack){
        let playerData = pack.player;
        let other = new Player(playerData.uuid, this.world, playerData.username, playerData.room, new Vector3(playerData.position.x, playerData.position.y, playerData.position.z), new Vector3(playerData.rotation.x, playerData.rotation.y, playerData.rotation.z));
        this.world.addPlayer(other);
    }

    onPlayerDisconnected(pack){
        this.world.removePlayer(pack.uuid);
    }

    onUpdatePlayers(pack){
        for(let i in pack){
            let other_pack = pack[i];
            let other = this.world.getPlayer(other_pack.uuid);
            if(other){
                other.position.set(other_pack.position.x, other_pack.position.y, other_pack.position.z);
                other.rotation.set(other_pack.rotation.x, other_pack.rotation.y, other_pack.rotation.z);
                other.velocity.set(other_pack.velocity.x, other_pack.velocity.y, other_pack.velocity.z);

                if(other_pack.selectedCoordInside == null){
                    other.selectedCoordInside = null;
                }else{
                    other.selectedCoordInside = new Coord(
                        other_pack.selectedCoordInside.x,
                        other_pack.selectedCoordInside.y,
                        other_pack.selectedCoordInside.z
                    );
                }

                if(other_pack.selectedCoordOutside == null){
                    other.selectedCoordOutside = null;
                }else{
                    other.selectedCoordOutside = new Coord(
                        other_pack.selectedCoordOutside.x,
                        other_pack.selectedCoordOutside.y,
                        other_pack.selectedCoordOutside.z
                    );
                }
            }
        }
    }

    onTerrainChanged(pack){
        let coord = new Coord(pack.coord.x, pack.coord.y, pack.coord.z);
        let chunk = this.world.getChunk(coord);
        chunk.getCell(coord).unpack(pack);
        this.worldRenderer.onChunkCreated(chunk);

        let actionName = 'mined'
        if(pack.type !== null){
            actionName = 'placed'
        }                    
        this.eventLog.addEntryToLog({
            text: '<span class="eventlog-username">' + this.world.getPlayer(pack.playerUUID).username + '</span> ' + actionName + ' terrain.'
        });
    }
}

export default Client;

function generateHeadMesh(gl){
    let positions = [
        //top
        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        //bottom
        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5, 
        0.5, -0.5, 0.5,

        //south
        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        //north
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,

        //west
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,

        //east
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
    ];

    let normals = [
        //top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        //bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        //south
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        //north
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        //west
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,

        //east
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0
    ];

    let uvs = [
        //top
        0.5, 0,
        0.5, 1,
        1, 1,
        1, 0,

        //bottom
        0.5, 0,
        0.5, 1,
        1, 1,
        1, 0,

        //south
        0.5, 0,
        0.5, 1,
        1, 1,
        1, 0,

        //north
        0, 1,
        0, 0,
        0.5, 0,
        0.5, 1,

        //west
        0.5, 0,
        0.5, 1,
        1, 1,
        1, 0,

        //east
        0.5, 0,
        0.5, 1,
        1, 1,
        1, 0,
    ];

    let indices = [
        0, 1, 2, 2, 3, 0,       //top
        4, 5, 6, 6, 7, 4,       //bottom
        8, 9, 10, 10, 11, 8,    //south
        12, 13, 14, 14, 15, 12, //north
        16, 17, 18, 18, 19, 16, //west
        20, 21, 22, 22, 23, 20, //east
    ];

    return new Mesh(gl, indices, positions, normals, uvs);
}

let vertShaderSourceString = `#version 300 es

	precision lowp float;

	uniform mat4 u_projection;
	uniform mat4 u_view;
	uniform mat4 u_model;
	
	in vec4 a_position;
	in vec3 a_normal;
	in vec2 a_uv;

	out vec3 v_normal;
	out vec2 v_uv;
	

	void main(){
		v_normal = (u_model * vec4(a_normal, 0.0)).xyz;
		v_uv = a_uv;

		gl_Position = u_projection * u_view * u_model * a_position;
	}

	float rand(vec2 co){
		return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
	}
`;

let fragShaderSourceString = `#version 300 es
	
	precision highp float;

	uniform sampler2D u_texture;

	uniform vec3 u_ambientIntensity;
	uniform vec3 u_sunlightDirection;
	uniform vec3 u_sunlightIntensity;

	in vec3 v_normal;
	in vec2 v_uv;

	out vec4 outColor;

	void main(){

		vec4 texel = texture(u_texture, v_uv);
		if(texel.a < 0.1)
			discard;

		outColor = texel;
	}
`;