'use strict';

import Vector3 from "./math/vector3.js";
import Coord from "./world/coord.js";

import Utils from './math/utils.js';
import AABB from './physics/aabb.js';

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
        this.selectedCoordInside = new Coord();
        this.selectedCoordOutside = new Coord();
        this.aabb = null;
        this.isGrounded = false;
        this.velocity = new Vector3();
    }

    tick(delta){

        this.look(delta);
        this.move(delta);
        
        this.calculateSelectedCells();
    }

    look(delta){
        if(this.is_looking == true){
            this.rotation.y -= this.look_delta.x * 0.15 * delta;
            this.rotation.x -= this.look_delta.y * 0.15 * delta;
            this.rotation.x = Utils.clamp(this.rotation.x, Utils.degToRad(-90), Utils.degToRad(90));
            this.look_delta.x = 0;
            this.look_delta.y = 0;
        }
    }

    move(delta){
        let vel = this.velocity;
        let pos = this.position;

        if(this.isGrounded == false){
            vel.y -= 1 * delta;
            if(vel.y <= -1) vel.y = -1;
        }

        if(this.move_input.magnitude() > 0){
            this.move_input = this.move_input.normalize();
            vel.x = this.move_input.x * 0.7 * delta;
            vel.z = this.move_input.z * 0.7 * delta;
        }else{
            vel.x = 0;
            vel.z = 0;
        }

        this.position = this.resolveCollisions(pos, vel);
        this.move_input.set(0, 0, 0);

        this.checkBounds();
    }

    jump(){
        if(this.isGrounded){
            this.velocity.y = 0.32;
        }
    }

    resolveCollisions(position, velocity){
        this.aabb = new AABB(   new Vector3((position.x + velocity.x) - 0.25, (position.y + velocity.y), (position.z + velocity.z) - 0.25),
                                new Vector3((position.x + velocity.x) + 0.25, (position.y + velocity.y) + 0.75, (position.z + velocity.z) + 0.25));
        
        let coord = new Coord(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));

        // check vertical (down) collision
        let potentials = [];
        for(let x = coord.x - 1; x <= coord.x + 1; x++){
			for(let z = coord.z - 1; z <= coord.z + 1; z++){
                let cellBelow = this.world.getCell(new Coord(x, coord.y - 1, z));
                if((cellBelow && cellBelow.getTerrain() != null)){
                    potentials.push(new AABB(new Vector3(x, coord.y - 1, z), new Vector3(x + 1, coord.y, z + 1)))
                }                
            }
        }
        this.isGrounded = false;
        for(let i = 0; i < potentials.length; i++){
            let cellAABB = potentials[i];
            if(this.aabb.intersectsAABB(cellAABB)){
				position.y = cellAABB.cornerB.y;
                velocity.y = 0;
                this.velocity.y = 0;
                this.isGrounded = true;
			}
        }

        //up
        let cellAbove = this.world.getCell(new Coord(coord.x, coord.y + 1, coord.z));
        if((cellAbove && cellAbove.getTerrain() != null)){
            let cellAABB = new AABB(new Vector3(coord.x, coord.y + 1, coord.z), new Vector3(coord.x + 1, coord.y + 2, coord.z + 1));

            if(this.aabb.intersectsAABB(cellAABB)){
                //console.log('up');
                this.velocity.y = 0;
                position.y = cellAABB.cornerA.y - 0.75;
                velocity.y = 0;
                //console.log(position.y);
            }
        }
        
        //north
        let cellNorth = this.world.getCell(new Coord(coord.x, coord.y, coord.z - 1));
        if((cellNorth && cellNorth.getTerrain() != null)){
            let cellAABB = new AABB(new Vector3(coord.x, coord.y, coord.z - 1), new Vector3(coord.x + 1, coord.y + 1, coord.z));

			if(this.aabb.intersectsAABB(cellAABB)){
				//console.log('north');
				position.z = cellAABB.cornerB.z + 0.25;
				velocity.z = 0;
				//console.log(position.z);
			}
        }

        //south
        let cellSouth = this.world.getCell(new Coord(coord.x, coord.y, coord.z + 1));
        if((cellSouth && cellSouth.getTerrain() != null)){
            let cellAABB = new AABB(new Vector3(coord.x, coord.y, coord.z + 1), new Vector3(coord.x + 1, coord.y + 1, coord.z + 2));

            if(this.aabb.intersectsAABB(cellAABB)){
                //console.log('south');
                position.z = cellAABB.cornerA.z - 0.25;
                velocity.z = 0;
                //console.log(position.z);
            }
        }

        //east
        let cellEast = this.world.getCell(new Coord(coord.x + 1, coord.y, coord.z));
        if((cellEast && cellEast.getTerrain() != null)){
            let cellAABB = new AABB(new Vector3(coord.x + 1, coord.y, coord.z), new Vector3(coord.x + 2, coord.y + 1, coord.z + 1));

			if(this.aabb.intersectsAABB(cellAABB)){
				//console.log('east');
				position.x = cellAABB.cornerA.x - 0.25;
				velocity.x = 0;
				//console.log(position.x);
			}
        }

        //west
        let cellWest = this.world.getCell(new Coord(coord.x - 1, coord.y, coord.z));
        if((cellWest && cellWest.getTerrain() != null)){
            let cellAABB = new AABB(new Vector3(coord.x -1, coord.y, coord.z), new Vector3(coord.x, coord.y + 1, coord.z + 1));

			if(this.aabb.intersectsAABB(cellAABB)){
				//console.log('west');
				position.x = cellAABB.cornerB.x + 0.25;
				velocity.x = 0;
				//console.log(position.x);
			}
        }
        
        return position.add(velocity);
    }

    checkBounds(){
        if(this.position.x <= 0){
            this.position.x = 0;
        }
        if(this.position.x >= 31.99){
            this.position.x = 31.99;
        }
        if(this.position.z <= 0){
            this.position.z = 0;
        }
        if(this.position.z >= 31.99){
            this.position.z = 31.99;
        }
    }

    calculateSelectedCells(){
        let ax = -Math.sin(this.rotation.y);
        let ay = Math.tan(this.rotation.x);
        let az = -Math.cos(this.rotation.y);
        let v = new Vector3(ax, ay, az).normalize();
        let cellCoord = new Vector3(this.getEyePos().x + v.x * 2, this.getEyePos().y + v.y * 2, this.getEyePos().z + v.z * 2);
        let cellCoordOut = new Vector3(this.getEyePos().x + v.x * 2, this.getEyePos().y + v.y * 2, this.getEyePos().z + v.z * 2);
        let raycastResult = this.world.raytrace(this.getEyePos(), cellCoord);
        if(raycastResult != null && raycastResult.enterPoint != null && raycastResult.normal != null){
            cellCoord = new Coord(raycastResult.enterPoint.x - raycastResult.normal.x * 0.01, raycastResult.enterPoint.y - raycastResult.normal.y * 0.01, raycastResult.enterPoint.z - raycastResult.normal.z * 0.01);
            cellCoordOut = new Coord(raycastResult.enterPoint.x + raycastResult.normal.x * 0.01, raycastResult.enterPoint.y + raycastResult.normal.y * 0.01, raycastResult.enterPoint.z + raycastResult.normal.z * 0.01);
        }else{
            cellCoord = null;
            cellCoordOut = null;
        }
        this.selectedCoordInside = cellCoord;
        this.selectedCoordOutside = cellCoordOut;
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