'use strict';

import Matrix4 from '../../shared/math/matrix4.js';

import DataBuffer from './graphics/databuffer.js';
import VertexArray from './graphics/vertexarray.js';
import Shader from './graphics/shader.js';
import Mesh from './graphics/mesh.js';
import Texture from './graphics/texture.js';

import World from '../../shared/world/world.js';
import Coord from '../../shared/world/coord.js';

class WorldRenderer{

    world = null;
    renderer = null;

    meshes = {};

    chunkMeshBuilder = null;
    texture = null;

    constructor(world, renderer){
        this.world = world;
        this.renderer = renderer;

        //this.chunkMeshBuilder = new ChunkMeshBuilder(this.renderer.getContext());
        // Texture.load(this.renderer.getContext(), '/client/res/textures/terrain.png', (texture) => {
        //     this.texture = texture;
        // });

        // this.world.registerOnChunkCreatedCallback(this.onChunkCreated.bind(this));
        // this.world.registerOnChunkDestroyedCallback(this.onChunkDestroyed.bind(this));
        // this.world.registerOnChunkUpdatedCallback(this.onChunkUpdated.bind(this));
    }

    render(){
        this.renderChunks();
    }

    renderChunks(){
        //this.renderer.getContext().bindTexture(this.renderer.getContext().TEXTURE_2D, this.texture);
        for(let chunkIdx in this.world.chunks){
            let chunk = this.world.chunks[chunkIdx];
            let matrix = Matrix4.create();
            matrix = Matrix4.translate(matrix, chunk.coord.x, chunk.coord.y, chunk.coord.z);
            this.renderer.shader.setUniformMatrix4fv('u_model', matrix);
            this.renderer.drawMesh(this.meshes[chunkIdx]);
        }
    }

    onChunkCreated(chunk){
        let mesh = this.generateChunkMesh(chunk);
        this.meshes[chunk.coord.getHash()] = mesh;

        let northChunk = this.world.getChunk(new Coord(chunk.coord.x, chunk.coord.y, chunk.coord.z - World.CHUNK_SIZE));
		if(northChunk){
			let otherChunkId = northChunk.coord.getHash();
			if(this.meshes[otherChunkId] != null){
				this.meshes[otherChunkId] = this.generateChunkMesh(northChunk);
			}
        }
        let southChunk = this.world.getChunk(new Coord(chunk.coord.x, chunk.coord.y, chunk.coord.z + World.CHUNK_SIZE));
		if(southChunk){
			let otherChunkId = southChunk.coord.getHash();
			if(this.meshes[otherChunkId] != null){
				this.meshes[otherChunkId] = this.generateChunkMesh(southChunk);
			}
        }
        let eastChunk = this.world.getChunk(new Coord(chunk.coord.x + World.CHUNK_SIZE, chunk.coord.y, chunk.coord.z));
		if(eastChunk){
			let otherChunkId = eastChunk.coord.getHash();
			if(this.meshes[otherChunkId] != null){
				this.meshes[otherChunkId] = this.generateChunkMesh(eastChunk);
			}
        }
        let westChunk = this.world.getChunk(new Coord(chunk.coord.x - World.CHUNK_SIZE, chunk.coord.y, chunk.coord.z));
		if(westChunk){
			let otherChunkId = westChunk.coord.getHash();
			if(this.meshes[otherChunkId] != null){
				this.meshes[otherChunkId] = this.generateChunkMesh(westChunk);
			}
        }
        
        let upChunk = this.world.getChunk(new Coord(chunk.coord.x, chunk.coord.y + World.CHUNK_SIZE, chunk.coord.z));
		if(upChunk){
			let otherChunkId = upChunk.coord.getHash();
			if(this.meshes[otherChunkId] != null){
				this.meshes[otherChunkId] = this.generateChunkMesh(upChunk);
			}
        }
        
        let downChunk = this.world.getChunk(new Coord(chunk.coord.x, chunk.coord.y - World.CHUNK_SIZE, chunk.coord.z));
		if(downChunk){
			let otherChunkId = downChunk.coord.getHash();
			if(this.meshes[otherChunkId] != null){
				this.meshes[otherChunkId] = this.generateChunkMesh(downChunk);
			}
		}
    }

    onChunkDestroyed(chunk){

    }

    onChunkUpdated(chunk){

    }

    generateChunkMesh(chunk){
        let positions = [];
        let uvs = [];
        let normals = [];
        let indices = [];
    
        let count = 0;
    
        for(var x = 0; x < World.CHUNK_SIZE; x++){
            for(var z = 0; z < World.CHUNK_SIZE; z++){
                for(var y = 0; y < World.CHUNK_SIZE; y++){
    
                    let coord = new Coord(x, y, z);
                    let cell = chunk.getCell(coord);
                    let worldCellCoord = chunk.coord.add(coord);
                    let terrain = cell.terrain;
    
                    if(terrain != null){
                        //UP
                        let upCell = chunk.world.getCell(worldCellCoord.up());
                        if((upCell && upCell.terrain == null) || upCell == null){
                            positions.push(
                                //Top
                                x, y + 1, z,
                                x, y + 1, z + 1,
                                x + 1, y + 1, z + 1,
                                x + 1, y + 1, z,
                            );
    
                            let tex = Texture.getUVFromIndex(0, 32, 512);
                            uvs.push(
                                //bottom
                                tex.x0, tex.y0,
                                tex.x0, tex.y1,
                                tex.x1, tex.y1,
                                tex.x1, tex.y0,
                            );
    
                            indices.push(
                                count + 0, count + 1, count + 2, count + 2, count + 3, count + 0
                            );
    
                            count += 4;
                        }
    
                        //Down
                        let downCell = chunk.world.getCell(worldCellCoord.down());
                        if((downCell && downCell.terrain == null) || downCell == null){
                            positions.push(
                                //Bottom
                                x, y, z + 1,
                                x, y, z,
                                x + 1, y, z, 
                                x + 1, y, z + 1,
                            );
    
                            let tex = Texture.getUVFromIndex(1, 32, 512);
                            uvs.push(
                                //bottom
                                tex.x0, tex.y0,
                                tex.x0, tex.y1,
                                tex.x1, tex.y1,
                                tex.x1, tex.y0,
                            );
    
                            indices.push(
                                count + 0, count + 1, count + 2, count + 2, count + 3, count + 0
                            );
    
                            count += 4;
                        }
    
                        //North
                        let northCell = chunk.world.getCell(worldCellCoord.north());
                        if((northCell && northCell.terrain == null) || northCell == null){
                            positions.push(
                                //Front
                                x + 1, y + 1, z,
                                x + 1, y, z,
                                x, y, z,
                                x, y + 1, z,
                            );
    
                            let tex = Texture.getUVFromIndex(1, 32, 512);
                            uvs.push(
                                //bottom
                                tex.x0, tex.y0,
                                tex.x0, tex.y1,
                                tex.x1, tex.y1,
                                tex.x1, tex.y0,
                            );
    
                            indices.push(
                                count + 0, count + 1, count + 2, count + 2, count + 3, count + 0
                            );
    
                            count += 4;
                        }
    
                        //South
                        let southCell = chunk.world.getCell(worldCellCoord.south());
                        if((southCell && southCell.terrain == null) || southCell == null){
                            positions.push(
                                //Back
                                x, y +1, z + 1,
                                x, y, z + 1,
                                x + 1, y, z + 1,
                                x + 1, y + 1, z + 1,
                            );
    
                            let tex = Texture.getUVFromIndex(1, 32, 512);
                            uvs.push(
                                //bottom
                                tex.x0, tex.y0,
                                tex.x0, tex.y1,
                                tex.x1, tex.y1,
                                tex.x1, tex.y0,
                            );
    
                            indices.push(
                                count + 0, count + 1, count + 2, count + 2, count + 3, count + 0
                            );
    
                            count += 4;
                        }
    
                        //East
                        let eastCell = chunk.world.getCell(worldCellCoord.east());
                        if((eastCell && eastCell.terrain == null) || eastCell == null){
                            positions.push(
                                //Left
                                
                                x + 1, y + 1, z + 1,
                                x + 1, y, z + 1,
                                x + 1, y, z,
                                x + 1, y + 1, z
                            );
    
                            let tex = Texture.getUVFromIndex(1, 32, 512);
                            uvs.push(
                                //bottom
                                tex.x0, tex.y0,
                                tex.x0, tex.y1,
                                tex.x1, tex.y1,
                                tex.x1, tex.y0,
                            );
    
                            indices.push(
                                count + 0, count + 1, count + 2, count + 2, count + 3, count + 0
                            );
    
                            count += 4;
                        }
    
                        //West
                        let westCell = chunk.world.getCell(worldCellCoord.west());
                        if((westCell && westCell.terrain == null) || westCell == null){
                            positions.push(
                                //Right
                                
                                x, y + 1, z,
                                x, y, z,
                                x, y, z + 1,
                                x, y + 1, z + 1
                            );
    
                            let tex = Texture.getUVFromIndex(1, 32, 512);
                            uvs.push(
                                //bottom
                                tex.x0, tex.y0,
                                tex.x0, tex.y1,
                                tex.x1, tex.y1,
                                tex.x1, tex.y0,
                            );
    
                            indices.push(
                                count + 0, count + 1, count + 2, count + 2, count + 3, count + 0
                            );
    
                            count += 4;
                        }
                    }
                }
            }
        }
    
        //now that we've calculated the data, store it into a mesh and return it
        let vertexBuffer = new DataBuffer(this.renderer.getContext(), this.renderer.getContext().ARRAY_BUFFER, new Float32Array(positions));
        let uvBuffer = new DataBuffer(this.renderer.getContext(), this.renderer.getContext().ARRAY_BUFFER, new Float32Array(uvs));
        let vbo = new DataBuffer(this.renderer.getContext(), this.renderer.getContext().ELEMENT_ARRAY_BUFFER, new Uint32Array(indices));
    
        let vao = new VertexArray(this.renderer.getContext());
        vao.addBuffer(vertexBuffer, {
            location: Shader.A_POSITION_LOC,
            type: this.renderer.getContext().FLOAT
        });
        vao.addBuffer(uvBuffer, {
            location: Shader.A_UV_LOC,
            type: this.renderer.getContext().FLOAT,
            size: 2,
            normalize: true
        });
    
        return new Mesh(this.renderer.getContext(), indices, positions, normals, uvs);
        //return new Mesh(vao, vbo, vbo.getCount(), vertexBuffer.getCount()/3);
    }
}

export default WorldRenderer;