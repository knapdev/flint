'use strict';

import Renderer from './graphics/renderer.js';
import Shader from './graphics/shader.js';
import Mesh from './graphics/mesh.js';
import Texture from './graphics/texture.js';

import Matrix4 from '../../shared/math/matrix4.js';
import Vector3 from '../../shared/math/vector3.js';

import Keyboard from './input/keyboard.js';

import World from '../../shared/world/world.js';
import WorldRenderer from './worldrenderer.js';
import Coord from '../../shared/world/coord.js';

import Player from '../../shared/player.js';
import Utils from '../../shared/math/utils.js';


class Client{

    renderer = null;
    shader = null;

    mesh = null;
    head_mesh = null;
    texture = null;
    guy_texture = null;
    grass_texture = null;
    bg_sound = null;
    boop_sound = null;
    
    socket = null;
    player = null;

    world = null;
    worldRenderer = null;

    then = 0.0;
    frame_id = null;

    constructor(config){
    }

    start(){
        console.log('Client started.');
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

    run(now){
        let delta = (now - this.then) / 1000.0;
        let fps = (1.0 / delta);

        this.update(delta);
        this.render();

        this.then = now;
        this.frame_id = requestAnimationFrame(this.run.bind(this));
    }

    update(delta){
        Keyboard._update();

        if(document.pointerLockElement == this.renderer.canvas){
            let key_input = {
                up: false,
                down: false,
                left: false,
                right: false
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
            if(key_input['up'] == true || key_input['down'] == true || key_input['left'] == true || key_input['right'] == true){
                this.socket.emit('key-input', key_input);
            }
        }
    }

    render(){
        this.renderer.clear();

        this.renderer.shader.bind();        

        let cam_player = Player.PLAYERS[this.player.uuid];
        this.renderer.setCamera(new Vector3(cam_player.position.x, cam_player.position.y + 0.5, cam_player.position.z), cam_player.rotation);

        // this.renderer.setTexture(this.grass_texture);
        // {
        //     let matrix = Matrix4.create();
        //     matrix = Matrix4.translate(matrix, 0, -0.5, 0);
        //     matrix = Matrix4.scale(matrix, 256, 1, 256);
        //     this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
        //     this.renderer.drawMesh(this.mesh);
        // }
        this.renderer.setTexture(this.texture);
        this.worldRenderer.render();

        
        // {
        //     let matrix = Matrix4.create();
        //     matrix = Matrix4.translate(matrix, 0.0, 0.5, 0.0);
        //     this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
        //     this.renderer.drawMesh(this.mesh);
        // }
        
        for(let u in Player.PLAYERS){
            let other = Player.PLAYERS[u];
            if(other != null && other.uuid != this.player.uuid){
                this.renderer.setTexture(this.guy_texture);
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.25, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.rotateX(matrix, other.rotation.x);
                    matrix = Matrix4.translate(matrix, 0.0, 0.25, 0.0);
                    matrix = Matrix4.scale(matrix, 0.5, 0.5, 0.5);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.head_mesh);
                }

                this.renderer.setTexture(this.texture);
                {
                    let matrix = Matrix4.create();
                    matrix = Matrix4.translate(matrix, other.position.x, other.position.y + 0.125, other.position.z);
                    matrix = Matrix4.rotateY(matrix, other.rotation.y);
                    matrix = Matrix4.scale(matrix, 0.4, 0.25, 0.25);
                    this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
                    this.renderer.drawMesh(this.mesh);
                }
            }
        }
    }

    initRenderer(){
        this.renderer = new Renderer('canvas', 'game-screen');

        this.shader = new Shader(this.renderer.getContext(), vertShaderSourceString, fragShaderSourceString);
        this.renderer.setShader(this.shader);

        this.renderer.setPerspective(50.0, 0.01, 256.0);
        this.renderer.setClearColor(0.72, 0.89, 0.99, 1.0);

        window.addEventListener('resize', (evnt) => {
            this.renderer.resize();
        });
        this.renderer.resize();

        this.mesh = generateMesh(this.renderer.getContext());
        this.head_mesh = generateHeadMesh(this.renderer.getContext())
        Texture.load(this.renderer.getContext(), '/client/res/textures/test.png', (texture) => {
            this.texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/guy.png', (texture) => {
            this.guy_texture = texture;
        });
        Texture.load(this.renderer.getContext(), '/client/res/textures/grass.png', (texture) => {
            this.grass_texture = texture;
        });

        this.bg_sound = new Audio();
		this.bg_sound.src = 'client/res/sounds/bg.mp3';
		this.bg_sound.volume = 0.25;
		this.bg_sound.loop = true;
        //this.bg_sound.play();
        
        this.boop_sound = new Audio();
		this.boop_sound.src = 'client/res/sounds/boop.mp3';
		this.boop_sound.volume = 0.25;

        this.renderer.canvas.addEventListener('mousemove', (evnt) => {
            this.socket.emit('set-look-delta', {
                x: evnt.movementX,
                y: evnt.movementY
            });
        });
        this.renderer.canvas.addEventListener('click', (evnt) => {
            if(evnt.button == 0){
                if(document.pointerLockElement !== this.renderer.canvas){
                    this.renderer.canvas.requestPointerLock();
                }                  
            }
        });
        document.addEventListener('pointerlockchange', (evnt) => {
            let flag = document.pointerLockElement === this.renderer.canvas;
            this.socket.emit('set-looking', {
                state: flag
            });
        });
    }

    initWorld(){
        this.world = new World('World', 'seed');
        this.worldRenderer = new WorldRenderer(this.world, this.renderer);

        for(let x = -8; x <= 8; x += 8){
            for(let z = -8; z <= 8; z += 8){
                this.world.createChunk(new Coord(x, -8, z));
            }
        }
    }

    login(){
        let username = document.getElementById('login-username');
        let password = document.getElementById('login-password');
        
        this.socket.emit('login', {
            username: username.value,
            password: password.value
        });

        this.socket.on('login-response', (pack) => {
            if(pack.success == true){
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('game-screen').style.display = 'block';
                this.initRenderer();
                this.initWorld();

                this.player = new Player(pack.uuid, pack.username, pack.room, new Vector3(pack.position.x, pack.position.y, pack.position.z), new Vector3(pack.rotation.x, pack.rotation.y, pack.rotation.z));

                for(let u in pack.player_list){
                    let pack_data = pack.player_list[u];
                    let other = new Player(pack_data.uuid, pack_data.username, pack_data.room, new Vector3(pack_data.position.x, pack_data.position.y, pack_data.position.z), new Vector3(pack_data.rotation.x, pack_data.rotation.y, pack_data.rotation.z));
                }

                document.getElementById('eventlog-header').innerText = this.capitalize(this.player.room);

                this.addEntryToLog({
                    time: pack.time,
                    text: 'Welcome to ' + this.capitalize(this.player.room) + ', <span class="eventlog-username">' + this.player.username + '</span>!'
                });
                this.addEntryToLog({
                    time: pack.time,
                    text: pack.motd
                });
                this.logUserList(pack);

                this.socket.on('player-connected', (pack) => {
                    let other = new Player(pack.uuid, pack.username, pack.room, new Vector3(pack.position.x, pack.position.y, pack.position.z), new Vector3(pack.rotation.x, pack.rotation.y, pack.rotation.z));
                    this.addEntryToLog({
                        time: pack.time,
                        text: '<span class="eventlog-username">' + other.username + '</span> connected!'
                    });
                });

                this.socket.on('player-disconnected', (pack) => {
                    let other = Player.PLAYERS[pack.uuid];
                    this.addEntryToLog({
                        time: pack.time,
                        text: '<span class="eventlog-username">' + other.username + '</span> disconnected.'
                    });
                    delete Player.PLAYERS[other.uuid];
                });

                this.socket.on('update-players', (pack) => {
                    for(let i in pack){
                        let other_pack = pack[i];
                        let other = Player.PLAYERS[other_pack.uuid];
                        if(other){
                            other.position.set(other_pack.position.x, other_pack.position.y, other_pack.position.z);
                            other.rotation.set(other_pack.rotation.x, other_pack.rotation.y, other_pack.rotation.z);
                        }
                    }
                });

                this.socket.on('log-player-message', (pack) => {
                    this.logUserMessage(pack);
                });
            
                this.socket.on('log-event', (pack) => {
                    this.logEvent(pack);
                });
        
                this.socket.on('log-player-list', (pack) => {
                    this.logUserList(pack);
                });
                
                let input = document.getElementById('eventlog-input');
                input.addEventListener('keyup', (evnt) => {
                    if(evnt.keyCode == 13){
                        if(input.value.length != 0){
                            this.socket.emit('chat-msg', {
                                data: input.value.toString()
                            });
                            input.value = '';
                        }
                    }
                });

                this.then = performance.now();
                this.frame_id = requestAnimationFrame(this.run.bind(this));
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

        this.socket.on('register-response', (pack) => {
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

    capitalize(str){
        if(typeof s !== 'string') str = str.toString();
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    logUserMessage(data){
        let text = '<span class="eventlog-username">' + data.username + '</span> says, <span class="eventlog-msg">"' + data.text + '"</span>';
        if(data.type == 'loud'){
            text = '<span class="eventlog-username">' + data.username + '</span> yells, <span class="eventlog-msg">"' + data.text + '"</span>';
        }
        
        this.addEntryToLog({
            time: data.time,
            text: text
        });
    }

    logEvent(data){
        this.addEntryToLog({
            time: data.time,
            text: data.text
        });
    }

    logUserList(data){
        let msg = '';        
        let first = true;
        for(let u in Player.PLAYERS){
            if(first == false){
                msg += ', ';
            }
            let other = Player.PLAYERS[u];
            msg += '<span class="eventlog-username">' + other.username + '</span>'
            if(first == true){
                first = false;
            }
        }
        this.addEntryToLog({
            time: data.time,
            text: 'Users: ' + msg + ' (Total: ' + Player.getPlayerCount() + ')'
        });
    }

    addEntryToLog(entry){
        let contents = document.getElementById('eventlog-contents');
        let elem = document.createElement('div');
        elem.id = 'eventlog-entry';
        elem.innerHTML = '[' + entry.time + '] ' + entry.text;
        contents.append(elem);
        contents.scrollTop = contents.scrollHeight;

        //this.boop_sound.play();
    }
}

export default Client;


function generateMesh(gl){
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
        0, 0,
        0, 1,
        1, 1,
        1, 0,

        //bottom
        0, 0,
        0, 1,
        1, 1,
        1, 0,

        //south
        0, 0,
        0, 1,
        1, 1,
        1, 0,

        //north
        0, 0,
        0, 1,
        1, 1,
        1, 0,

        //west
        0, 0,
        0, 1,
        1, 1,
        1, 0,

        //east
        0, 0,
        0, 1,
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

	precision mediump float;

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