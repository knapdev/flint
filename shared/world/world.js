'use strict';

import Chunk from "./chunk.js";
import Coord from "./coord.js";



class World{

    static CHUNK_SIZE = 8;

    name = '';

    chunks = {};

    onChunkCreatedCallbacks = [];
    onChunkDestroyedCallbacks = [];
    onChunkUpdatedCallbacks = [];

    constructor(name){
        this.name = name || 'New World';
    }

    tick(delta){

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
}

export default World;