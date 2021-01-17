'use strict';

import Vector3 from "./math/vector3.js";

class User{
    static USERS = {};
    static getUserCount(){
        let count = 0;
        for(let u in User.USERS){
            count++;
        }
        return count;
    }
    static getUsersInRoom(room){
        let ret = {};
        for(let u in User.USERS){
            let user = User.USERS[u];
            if(user.room === room){
                ret[user.uuid] = {
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
                };
            }
        }
        return ret;
    }

    constructor(uuid, name, room, position, rotation){
        this.uuid = uuid;
        this.name = name;
        this.room = room;
        this.position = position;
        this.rotation = rotation;
        this.look_delta = new Vector3();
        this.is_looking = false;
        this.move_input = new Vector3();

        User.USERS[this.uuid] = this;
    }
}

export default User;