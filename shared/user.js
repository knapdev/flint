'use strict';

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
                ret[user.uuid] = user;
            }
        }
        return ret;
    }

    constructor(uuid, name, room){
        this.uuid = uuid;
        this.name = name;
        this.room = room;

        User.USERS[this.uuid] = this;
    }
}

export default User;