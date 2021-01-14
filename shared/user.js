'use strict';

class User{
    constructor(uuid, socket, name){
        this.uuid = uuid;
        this.socket = socket;
        this.name = name;
    }
}

export default User;