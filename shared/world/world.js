'use strict';

import Chunk from "./chunk.js";
import Coord from "./coord.js";
import Direction from './direction.js';

import Vector3 from '../math/vector3.js';

class World{

    static CHUNK_SIZE = 8;

    name = '';

    chunks = {};

    players = {};

    onChunkCreatedCallbacks = [];
    onChunkDestroyedCallbacks = [];
    onChunkUpdatedCallbacks = [];

    constructor(name){
        this.name = name || 'New World';
    }

    tick(delta){

    }

    addPlayer(player){
        if(this.players[player.uuid] == undefined){
            this.players[player.uuid] = player;
        }
    }

    removePlayer(player){
        delete this.players[player.uuid];
    }

    getPlayer(uuid){
        if(this.players[uuid] == undefined){
            return null;
        }

        return this.players[uuid];
    }

    addChunk(chunk){
        if(this.chunks[chunk.coord.getHash()] == undefined){
            this.chunks[chunk.coord.getHash()] = chunk;
        }
    }

    destroyChunk(coord){
        let chunk = this.getChunk(coord);
        if(chunk){
            delete this.chunks[coord.getHash()];
        }
    }

    getChunk(coord){
        let size = World.CHUNK_SIZE;
        let chunk_coord = new Coord(
            Math.floor(coord.x / size) * World.CHUNK_SIZE,
            Math.floor(coord.y / size) * World.CHUNK_SIZE,
            Math.floor(coord.z / size) * World.CHUNK_SIZE
        );

        let chunk = this.chunks[chunk_coord.getHash()];
        return chunk;
    }

    getChunkNeighbor(coord, direction){
        console.error('getChunkNeighbor not implemented.');
    }

    getCell(coord){
        let chunk = this.getChunk(coord);
        if(chunk){
            let cell_coord = new Coord(coord.x - chunk.coord.x, coord.y - chunk.coord.y, coord.z - chunk.coord.z);
            let cell = chunk.getCell(cell_coord);
            return cell;
        }else{
            return null;
        }
    }

    getCellNeighbor(coord, direction){
        let chunk = this.getChunk(coord);
        if(chunk){
            let cell_coord = new Coord(coord.x - chunk.coord.x, coord.y - chunk.coord.y, coord.z - chunk.coord.z);
            let cell = chunk.getCellNeighbor(coord, direction);
            return cell;
        }else{
            return null;
        }
    }

    registerOnChunkCreatedCallback(callback){
        this.onChunkCreatedCallbacks.push(callback);
    }
    unregisterOnChunkCreatedCallback(callback){
        this.onChunkCreatedCallbacks.remove(callback);
    }
    registerOnChunkDestroyedCallback(callback){
        this.onChunkDestroyedCallbacks.push(callback);
    }
    unregisterOnChunkDestroyedCallback(callback){
        this.onChunkDestroyedCallbacks.remove(callback);
    }
    registerOnChunkUpdatedCallback(callback){
        this.onChunkUpdatedCallbacks.push(callback);
    }
    unregisterOnChunkUpdatedCallback(callback){
        this.onChunkUpdatedCallbacks.remove(callback);
    }

    getNoise(x, y, z, scale, max){
		return Math.floor((this.noise.simplex3(x * scale, y * scale, z * scale) + 1.0) * (max / 2.0));
    }
    
    raytrace(start, end){
		
		if(start instanceof Vector3 == false || end instanceof Vector3 == false){
			console.error('World.raytrace() : start or end parameters must be Vector3s');
			return null;
		}

		//Get start cell coord
		let sX = Math.floor(start.x);
		let sY = Math.floor(start.y);
		let sZ = Math.floor(start.z);

		//Get end cell coord
		let eX = Math.floor(end.x);
		let eY = Math.floor(end.y);
		let eZ = Math.floor(end.z);

		//Check start cell for a block, if it has one get the AABB and do a line intersection test
		let cellCoord = new Coord(sX, sY, sZ);
		let cell = this.getCell(cellCoord);
		if(cell !== null && cell.getAABB(cellCoord) !== null){
			let result = cell.getAABB(cellCoord).intersectsLine(start, end);
			if(result !== null){
				console.log('return first cell');
				return result;
			}
		}

		//If we didn't get hit the first cells block aabb, or if it doesn't have one at all
		let result2 = null;
		let i = 128;

		while(i-- >= 0){
			//We have reached the end coord without hitting a block, return null
			if(sX == eX && sY == eY && sZ == eZ){
				return null;
			}

			let moveOnX = true;
			let moveOnY = true;
			let moveOnZ = true;

			let maxX = 999.0;
			let maxY = 999.0;
			let maxZ = 999.0;

			//get boundaries
			if(eX > sX){
				maxX = sX + 1.0;
			}else if(eX < sX){
				maxX = sX;
			}else{
				moveOnX = false;
			}

			if(eY > sY){
				maxY = sY + 1.0;
			}else if(eY < sY){
				maxY = sY;
			}else{
				moveOnY = false;
			}

			if(eZ > sZ){
				maxZ = sZ + 1.0;
			}else if(eZ < sZ){
				maxZ = sZ;
			}else{
				moveOnZ = false;
			}

			let percentX = 999.0;
			let percentY = 999.0;
			let percentZ = 999.0;

			let lengthX = end.x - start.x;
			let lengthY = end.y - start.y;
			let lengthZ = end.z - start.z;

			if(moveOnX){
				percentX = (maxX - start.x) / lengthX;
			}

			if(moveOnY){
				percentY = (maxY - start.y) / lengthY;
			}

			if(moveOnZ){
				percentZ = (maxZ - start.z) / lengthZ;
			}

			let dirFacing = null;
			let normal = new Vector3();

			if(percentX < percentY && percentX < percentZ){
				dirFacing = (eX > sX) ? Direction.WEST : Direction.EAST;
				normal.x = (eX > sX) ? -1 : 1;
				start = new Vector3(maxX, start.y + lengthY * percentX, start.z + lengthZ * percentX);
			}else if(percentY < percentZ){
				dirFacing = (eY > sY) ? Direction.DOWN : Direction.UP;
				normal.y = (eY > sY) ? -1 : 1;
				start = new Vector3(start.x + lengthX * percentY, maxY, start.z + lengthZ * percentY);
			}else{
				dirFacing = (eZ > sZ) ? Direction.NORTH : Direction.SOUTH;
				normal.z = (eZ > sZ) ? -1 : 1;
				start = new Vector3(start.x + lengthX * percentZ, start.y + lengthY * percentZ, maxZ);
			}

			//set coord for next step
			sX = Math.floor(start.x) - ((dirFacing == Direction.EAST) ? 1 : 0);
			sY = Math.floor(start.y) - ((dirFacing == Direction.UP) ? 1 : 0);
			sZ = Math.floor(start.z) - ((dirFacing == Direction.SOUTH) ? 1 : 0);

            cellCoord = new Coord(sX, sY, sZ);
            let cell = this.getCell(cellCoord);
			if(cell !== null && cell.getAABB(cellCoord) !== null){
				let result = cell.getAABB(cellCoord).intersectsLine(start, end);
				if(result !== null){
					result.sideHit = dirFacing;
					result.normal = normal;
					return result;
				}
			}
		}

		return null;
	}
}

export default World;