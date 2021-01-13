'use strict';

class Shader {
	static A_POSITION_NAME = 'a_position';
	static A_POSITION_LOC = 0;
	static A_NORMAL_NAME = 'a_normal';
	static A_NORMAL_LOC = 1;
	static A_UV_NAME = 'a_uv';
	static A_UV_LOC = 2;

	constructor(gl, vertShaderSource, fragShaderSource){
		this.gl = gl;

		let vertShader = this.compileShader(this.gl.VERTEX_SHADER, vertShaderSource);
		let fragShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragShaderSource);
		this.program = this.linkProgram(vertShader, fragShader);

		this.uniforms = {};
		this.attributes = {};
	}


	bind(){
		this.gl.useProgram(this.program);
	}

	unbind(){
		this.gl.useProgram(null);
	}

	setUniform1i(name, v){
		let location = this.getUniformLocation(name);
		this.gl.uniform1i(location, v);
	}

	setUniform1f(name, v0){
		let location = this.getUniformLocation(name);
		this.gl.uniform1f(location, v0);
	}

	setUniform1fv(name, value){
		let location = this.getUniformLocation(name);
		this.gl.uniform1fv(location, value);
	}

	setUniform2f(name, v0, v1){
		let location = this.getUniformLocation(name);
		this.gl.uniform2f(location, v0, v1);
	}

	setUniform2fv(name, value){
		let location = this.getUniformLocation(name);
		this.gl.uniform2fv(location, value);
	}

	setUniform3fv(name, value){
		let location = this.getUniformLocation(name);
		this.gl.uniform3fv(location, value);
	}

	setUniform4fv(name, value){
		let location = this.getUniformLocation(name);
		this.gl.uniform4fv(location, value);
	}

	setUniformMatrix3fv(name, value){
		let location = this.getUniformLocation(name);
		this.gl.uniformMatrix3fv(location, false, value);
	}

	setUniformMatrix4fv(name, value){
		let location = this.getUniformLocation(name);
		this.gl.uniformMatrix4fv(location, false, value);
	}

	getUniformLocation(name){
		if(this.uniforms[name]){
			return this.uniforms[name];
		}

		let location = this.gl.getUniformLocation(this.program, name);

		if(location === null){
			console.warn('Warning: Shader uniform "' + name + '" does not exist!');
		}

		this.uniforms[name] = location;

		return location;
	}


	linkProgram(vertShader, fragShader){
		let program = this.gl.createProgram();
		this.gl.attachShader(program, vertShader);
		this.gl.attachShader(program, fragShader);

		this.gl.bindAttribLocation(program, Shader.A_POSITION_LOC, Shader.A_POSITION_NAME);
		this.gl.bindAttribLocation(program, Shader.A_NORMAL_LOC, Shader.A_NORMAL_NAME);
		this.gl.bindAttribLocation(program, Shader.A_UV_LOC, Shader.A_UV_NAME);

		this.gl.linkProgram(program);

		let success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
		if(success){
			return program;
		}

		console.error('Error linking shader program: ' + this.gl.getProgramInfoLog(program));
		this.gl.deleteProgram(program);
		return null;
	}

	compileShader(type, source){
		let shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);

		let success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
		if(success){
			return shader;
		}

		console.error('Error compiling shader: ' + this.gl.getShaderInfoLog(shader));
		this.gl.deleteShader(shader);
		return null;
	}
}

export default Shader;