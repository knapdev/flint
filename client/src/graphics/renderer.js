'use strict';

import Matrix4 from '../../../shared/math/matrix4.js'

import Shader from './shader.js'

import Utils from '../../../shared/math/utils.js'

class Renderer {
	constructor(canvas_id, container_id){
		this.canvas = document.createElement(canvas_id);
		let container = container_id != undefined ? document.getElementById(container_id) : document.body;
		container.prepend(this.canvas);
		try{
			this.gl = this.canvas.getContext('webgl2');
		}catch(e){
			throw 'WebGL2 not supported!';
		}

		this.gl.clearDepth(1.0);
		this.gl.depthFunc(this.gl.LEQUAL);
		this.gl.enable(this.gl.DEPTH_TEST);

		this.gl.frontFace(this.gl.CCW);
		this.gl.cullFace(this.gl.BACK);
		this.gl.enable(this.gl.CULL_FACE);

		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.enable(this.gl.BLEND);

		this.shader = null;

		this.fov = 60;
		this.near = 0.01;
		this.far = 128.0;

		this.scale = 1;
	}

	getContext(){
		return this.gl;
	}

	setClearColor(r, g, b, a){
		this.gl.clearColor(r, g, b, a);
	}

	clear(){
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	}

	resize(){
		let w = window.innerWidth;
		let h = window.innerHeight;

		if(this.canvas.width !== w/this.scale || this.canvas.height !== h/this.scale){
			this.canvas.width = w/this.scale;
			this.canvas.height = h/this.scale;
			this.canvas.style.width = w + 'px';
			this.canvas.style.height = h + 'px';

			this.setPerspective(this.fov, this.near, this.far);
			this.gl.viewport(0, 0, w/this.scale, h/this.scale);
		}
	}

	setShader(shader){
		this.shader = shader;
		this.shader.bind();
	}

	setTexture(texture){
		if(texture != null){
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture.data);
        }
	}

	setPerspective(fov, near, far){
		this.fov = fov;
		this.near = near;
		this.far = far;

		this.projectionMatrix = Matrix4.create();
		this.projectionMatrix = Matrix4.perspective(Utils.degToRad(fov), this.canvas.clientWidth / this.canvas.clientHeight, near, far);
		this.shader.setUniformMatrix4fv('u_projection', this.projectionMatrix);
		
		return this.projectionMatrix;
	}

	setCamera(position, rotation){
		let cameraMatrix = Matrix4.create();
		cameraMatrix = Matrix4.translate(cameraMatrix, position.x, position.y, position.z);
		cameraMatrix = Matrix4.rotateZ(cameraMatrix, rotation.z);
		cameraMatrix = Matrix4.rotateY(cameraMatrix, rotation.y);
		cameraMatrix = Matrix4.rotateX(cameraMatrix, rotation.x);

		this.viewMatrix = Matrix4.inverse(cameraMatrix);
		this.shader.setUniformMatrix4fv('u_view', this.viewMatrix);

		return cameraMatrix;
	}

	draw(shader, vertexArray, indexBuffer){

		shader.bind();

		vertexArray.bind();
		indexBuffer.bind();

		let primitiveType = this.gl.TRIANGLES;
		let count = indexBuffer.getCount();
		let type = this.gl.UNSIGNED_INT;
		let offset = 0;

		this.gl.drawElements(primitiveType, count, type, offset);
	}

	drawMesh(mesh, t){
		this.shader.bind();

		mesh.vao.bind();
		mesh.vbo.bind();

		if(t == undefined){
			t = this.gl.TRIANGLES;
		}

		let primitiveType = t;
		let count = mesh.indexCount;
		let type = this.gl.UNSIGNED_INT;
		let offset = 0;

		this.gl.drawElements(primitiveType, count, type, offset);
	}
}

export default Renderer;