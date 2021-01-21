'use strict';

import Vector3 from "./math/vector3.js";
import Coord from "./world/coord.js";

import Utils from './math/utils.js';

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

    tick(delta){
        if(this.is_looking == true){
            this.rotation.y -= this.look_delta.x * 0.15 * delta;
            this.rotation.x -= this.look_delta.y * 0.15 * delta;
            this.rotation.x = Utils.clamp(this.rotation.x, Utils.degToRad(-90), Utils.degToRad(90));
            this.look_delta.x = 0;
            this.look_delta.y = 0;
        }

        let vel = new Vector3();
        let pos = this.position;

        if(this.move_input.magnitude() > 0){
            this.move_input = this.move_input.normalize();
            vel.x = this.move_input.x * 3 * delta;
            vel.y = this.move_input.y * 3 * delta;
            vel.z = this.move_input.z * 3 * delta;
        }

        this.position = pos.add(vel);
        this.move_input.set(0, 0, 0);

        //calculate players selected cell
        let ax = -Math.sin(this.rotation.y);
        let ay = Math.tan(this.rotation.x);
        let az = -Math.cos(this.rotation.y);
        let v = new Vector3(ax, ay, az).normalize();
        let cellCoord = new Vector3(this.getEyePos().x + v.x * 128, this.getEyePos().y + v.y * 128, this.getEyePos().z + v.z * 128);
        let raycastResult = this.world.raytrace(this.getEyePos(), cellCoord);
        if(raycastResult != null && raycastResult.enterPoint != null && raycastResult.normal != null){
            cellCoord = new Coord(raycastResult.enterPoint.x - raycastResult.normal.x * 0.01, raycastResult.enterPoint.y - raycastResult.normal.y * 0.01, raycastResult.enterPoint.z - raycastResult.normal.z * 0.01);
        }
        this.selectedCoord = cellCoord;
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