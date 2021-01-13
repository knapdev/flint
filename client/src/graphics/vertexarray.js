'use strict';

class VertexArray {
	constructor(gl){
		this.gl = gl;

		this.vao = this.gl.createVertexArray();
		this.gl.bindVertexArray(this.vao);
	}

	bind(){
		this.gl.bindVertexArray(this.vao);
	}

	unbind(){
		this.gl.bindVertexArray(null);
	}


	addBuffer(buffer, layout){
		let location = layout.location;
		let size = layout.size || 3;
		let type = layout.type;
		let normalize = layout.normalize || false;
		let stride = layout.stride || 0;
		let offset = layout.offset || 0;

		this.gl.bindVertexArray(this.vao);
		buffer.bind();

		this.gl.enableVertexAttribArray(location);
		this.gl.vertexAttribPointer(location, size, type, normalize, stride, offset);

		buffer.unbind();
		this.gl.bindVertexArray(null);
	}
}

export default VertexArray;