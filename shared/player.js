'use strict';

import Vector3 from "./math/vector3.js";

class Player{
    static PLAYERS = {};
    static getPlayerCount(){
        let count = 0;
        for(let u in Player.PLAYERS){
            count++;
        }
        return count;
    }
    static getPlayersInRoom(room){
        let ret = {};
        for(let u in Player.PLAYERS){
            let player = Player.PLAYERS[u];
            if(player.room === room){
                ret[player.uuid] = {
                    uuid: player.uuid,
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
                };
            }
        }
        return ret;
    }

    constructor(uuid, username, room, position, rotation){
        this.uuid = uuid;
        this.username = username;
        this.room = room;
        this.position = position;
        this.rotation = rotation;
        this.look_delta = new Vector3();
        this.is_looking = false;
        this.move_input = new Vector3();

        Player.PLAYERS[this.uuid] = this;
    }

    getEyePos(){
		return new Vector3(this.position.x, this.position.y + 0.5, this.position.z);
	}
}

export default Player;