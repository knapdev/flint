'use strict';

import DataBuffer from './databuffer.js';
import VertexArray from './vertexarray.js';
import Shader from './shader.js';

class Mesh {
	constructor(gl, indices, vertices, normals, uvs){
		
		let vertexBuffer = new DataBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(vertices));
		let normalBuffer = new DataBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(normals));
		let uvBuffer = new DataBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(uvs));
		this.vbo = new DataBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices));
	
		this.vao = new VertexArray(gl);
		this.vao.addBuffer(vertexBuffer, {
			location: Shader.A_POSITION_LOC,
			type: gl.FLOAT
		});
		this.vao.addBuffer(normalBuffer, {
			location: Shader.A_NORMAL_LOC,
			type: gl.FLOAT,
			normalize: true
		});
		this.vao.addBuffer(uvBuffer, {
			location: Shader.A_UV_LOC,
			type: gl.FLOAT,
			size: 2,
			normalize: true,
		});

		this.indexCount = this.vbo.getCount();
		this.vertexCount = vertexBuffer.getCount()/3;
	}

	static loadOBJ(gl, source, callback){
		Mesh.parseOBJ(source, (err, data) => {
			//if(err) throw new Error('Error parsing OBJ file: ' + err);
			let mesh = new Mesh(gl, data.indices, data.verts, data.normals, data.uvs);
			callback(mesh);
		});
	}

	//https://github.com/YuqinShao/WebGL-Obj-Loader/blob/master/webgl-obj-loader.js
	static parseOBJ(source, callback){
		var v = [];
		var vn = [];
		var vt = [];

		let pack = {};
		pack.verts = [];
		pack.normals = [];
		pack.uvs = [];
		pack.indices = [];

		let indexCache = [];
		let index = 0;

		let lines = source.split('\n');
		lines.forEach((line) => {
			if(line.length === 0 || line.charAt(0) === '#'){
				return;
			}

			var chunks = line.split(' ');
			switch(chunks[0]){
				case 'v':
					if(chunks.length < 3){
						throw new Error('parse-obj: Invalid vertex :' + line);
					}
					v.push(parseFloat(chunks[1]), parseFloat(chunks[2]), parseFloat(chunks[3]));
					break;

				case 'vn':
					if(chunks.length < 3){
						throw new Error('parse-obj: Invalid vertex normal:' + line);
					}
					vn.push(parseFloat(chunks[1]), parseFloat(chunks[2]), parseFloat(chunks[3]));
					break;

				case 'vt':
					if(chunks.length < 2){
						throw new Error('parse-obj: Invalid vertex texture coord:' + line);
					}
					vt.push(parseFloat(chunks[1]), parseFloat(chunks[2]));
					break;

				case 'f':
					let quad = false;
					for(var i = 1; i < chunks.length; i++){
						if(i == 4 && !quad){
							i = 3;
							quad = true;
						}

						if(chunks[i] in indexCache){
							pack.indices.push(indexCache[chunks[i]]);
						}else{
							var indices = chunks[i].split('/');
							pack.verts.push(v[(parseInt(indices[0]) - 1) * 3 + 0]);
							pack.verts.push(v[(parseInt(indices[0]) - 1) * 3 + 1]);
							pack.verts.push(v[(parseInt(indices[0]) - 1) * 3 + 2]);
							pack.uvs.push(vt[(parseInt(indices[1]) - 1) * 2 + 0]);
							pack.uvs.push(vt[(parseInt(indices[1]) - 1) * 2 + 1]);

							pack.normals.push(vn[(parseInt(indices[2]) - 1) * 3 + 0]);
							pack.normals.push(vn[(parseInt(indices[2]) - 1) * 3 + 1]);
							pack.normals.push(vn[(parseInt(indices[2]) - 1) * 3 + 2]);
							indexCache[chunks[i]] = index;
							pack.indices.push(index);
							index += 1;
						}

						if(i == 4 && quad){
							pack.indices.push(indexCache[chunks[1]]);
						}
					}
					break;

				case 'o':
				case 's':
					break;

				default:
					throw new Error('parse-obj: Unrecognized directive: "' + chunks[0] + '"');
			}
		});

		callback(null, pack);
	}
}

export default Mesh;