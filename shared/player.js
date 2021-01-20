'use strict';

import Vector3 from "./math/vector3.js";
import Coord from "./world/coord.js";

class Player{

    constructor(uuid, world, username, room, position, rotation){
        this.uuid = uuid;
        this.world = world;
        this.username = username;
        this.room = room;
        this.position = position;
        this.rotation = rotation;
        this.look_delta = new Vector3();
        this.is_looking = false;
        this.move_input = new Vector3();
        this.selectedCoord = new Coord();
    }

    getEyePos(){
		return new Vector3(this.position.x, this.position.y + 0.5, this.position.z);
    }
    
    pack(){
        let pack = {
            uuid: this.uuid,
            username: this.username,
            room: this.room,
            position: {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z
            },
            rotation: {
                x: this.rotation.x,
                y: this.rotation.y,
                z: this.rotation.z
            }
        };
        return pack;
    }

    unpack(pack){
        
    }
}

export default Player;