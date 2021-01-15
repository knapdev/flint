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
    static getUserPack(){
        return JSON.stringify(User.USERS);
    }

    constructor(uuid, name, room){
        this.uuid = uuid;
        this.name = name;
        this.room = room;

        User.USERS[this.uuid] = this;
    }
}

export default User;