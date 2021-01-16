'use strict';

import User from '../../shared/user.js';

class Game{
    
    socket = null;
    user = null;

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

        this.socket.on('user-created', (pack) => {
            this.user = new User(pack.uuid, pack.name, pack.room);
    
            this.socket.emit('user-created-res', {
                success: true
            });
    
            this.socket.on('join-room', (pack) => {
                this.joinRoom(pack);
            });
        });

        this.then = performance.now();
        this.frame_id = requestAnimationFrame(this.run.bind(this));
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

    }

    render(){

    }

    joinRoom(pack){
        this.user.room = pack.room;
        document.getElementById('eventlog-header').innerText = this.capitalize(this.user.room);

        this.addEntryToLog({
            time: pack.time,
            text: 'Welcome to ' + this.capitalize(this.user.room) + ', <span class="eventlog-username">' + this.user.name + '</span>!'
        });
        this.addEntryToLog({
            time: pack.time,
            text: pack.motd
        });

        for(let u in pack.user_list){
            let pack_data = pack.user_list[u];
            let other = new User(pack_data.uuid, pack_data.name, pack_data.room);
        }
        this.logUserList(pack);

        this.socket.on('user-connected', (pack) => {
            let other = new User(pack.uuid, pack.username, pack.room);
            this.addEntryToLog({
                time: pack.time,
                text: '<span class="eventlog-username">' + other.name + '</span> connected!'
            });
        });
    
        this.socket.on('user-disconnected', (pack) => {
            let other = User.USERS[pack.uuid];
            this.addEntryToLog({
                time: pack.time,
                text: '<span class="eventlog-username">' + other.name + '</span> disconnected.'
            });
            delete User.USERS[other.uuid];
        });
    
        this.socket.on('log-user-message', (pack) => {
            this.logUserMessage(pack);
        });
    
        this.socket.on('log-event', (pack) => {
            this.logEvent(pack);
        });

        this.socket.on('log-user-list', (pack) => {
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

        this.socket.on('leave-room', (pack) => {
            this.socket.removeAllListeners('user-connected');
            this.socket.removeAllListeners('user-disconnected');
            this.socket.removeAllListeners('log-user-message');
            this.socket.removeAllListeners('log-event');
            this.socket.removeAllListeners('log-user-list');
            User.USERS = {};
        });
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
        let text = '<span class="eventlog-username">' + data.name + '</span> says, <span class="eventlog-msg">"' + data.text + '"</span>';
        if(data.type == 'loud'){
            text = '<span class="eventlog-username">' + data.name + '</span> yells, <span class="eventlog-msg">"' + data.text + '"</span>';
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
        for(let u in User.USERS){
            if(first == false){
                msg += ', ';
            }
            let other = User.USERS[u];
            msg += '<span class="eventlog-username">' + other.name + '</span>'
            if(first == true){
                first = false;
            }
        }
        this.addEntryToLog({
            time: data.time,
            text: 'Users: ' + msg + ' (Total: ' + User.getUserCount() + ')'
        });
    }

    addEntryToLog(entry){
        let contents = document.getElementById('eventlog-contents');
        let elem = document.createElement('div');
        elem.id = 'eventlog-entry';
        elem.innerHTML = '[' + entry.time + '] ' + entry.text;
        contents.append(elem);
        contents.scrollTop = contents.scrollHeight;
    }
}

export default Game;