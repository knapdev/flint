'use strict';

import User from "../../shared/user.js";

window.addEventListener('load', (evnt) => {
    main();    
});

let user = null;

function main(){
    console.log('Client started.');

    let login_button = document.getElementById('login-button');
    login_button.addEventListener('click', (evnt) => {
        let username = document.getElementById('login-username').value;
        let room = document.getElementById('login-room').value || 'general';

        let socket = io();
        socket.emit('join', {
            username: username,
            room: room
        });

        socket.on('connect-success', (pack) => {
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('game-screen').style.display = 'block';
            user = new User(pack.uuid, pack.username, pack.room);

            addEntryToLog({
                time: pack.time,
                text: 'Welcome to ' + pack.room + ', <span class="eventlog-username">' + user.name + '</span>!'
            });
            addEntryToLog({
                time: pack.time,
                text: pack.motd
            });
            let upack = pack.user_list;
            for(let u in upack){
                let up = upack[u];
                let other = new User(up.uuid, up.name, up.room);
            }
            logUserList(pack);


            socket.on('user-connected', (pack) => {
                let other = new User(pack.uuid, pack.username, pack.room);
                addEntryToLog({
                    time: pack.time,
                    text: '<span class="eventlog-username">' + other.name + '</span> connected!'
                });
            });
        
            socket.on('user-disconnected', (pack) => {
                let other = User.USERS[pack.uuid];
                addEntryToLog({
                    time: pack.time,
                    text: '<span class="eventlog-username">' + other.name + '</span> disconnected.'
                });
                delete User.USERS[other.uuid];
            });
        
            socket.on('log-user-message', (pack) => {
                logUserMessage(pack);
            });
        
            socket.on('log-event', (pack) => {
                logEvent(pack);
            });

            socket.on('log-user-list', (pack) => {
                logUserList(pack);
            });
            
            let input = document.getElementById('eventlog-input');
            input.addEventListener('keyup', (evnt) => {
                if(evnt.keyCode == 13){
                    if(input.value.length != 0){
                        socket.emit('chat-msg', {
                            data: input.value.toString()
                        });
                        input.value = '';
                    }
                }
            });
        });
    });
}

function logUserMessage(data){
    let text = '<span class="eventlog-username">' + data.name + '</span> says, <span class="eventlog-msg">"' + data.text + '"</span>';
    if(data.type == 'loud'){
        text = '<span class="eventlog-username">' + data.name + '</span> yells, <span class="eventlog-msg">"' + data.text + '"</span>';
    }
    
    addEntryToLog({
        time: data.time,
        text: text
    });
}

function logEvent(data){
    addEntryToLog({
        time: data.time,
        text: data.text
    });
}

function logUserList(data){
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
    addEntryToLog({
        time: data.time,
        text: 'Users: ' + msg + ' (Total: ' + User.getUserCount() + ')'
    });
}

function addEntryToLog(entry){
    let contents = document.getElementById('eventlog-contents');
    let elem = document.createElement('div');
    elem.id = 'eventlog-entry';
    elem.innerHTML = '[' + entry.time + '] ' + entry.text;
    contents.append(elem);
    contents.scrollTop = contents.scrollHeight;
}