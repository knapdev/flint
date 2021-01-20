import Vector3 from '../math/vector3.js';

class AABB {
	constructor(cornerA, cornerB){
		this.cornerA = cornerA;
		this.cornerB = cornerB;
	}

	intersectsLine(start, end){
		let fLow = 0;
		let fHigh = 1;

		// X
		let fX = (this.cornerA.x - start.x) / (end.x - start.x);
		let fX2 = (this.cornerB.x - start.x) / (end.x - start.x);

		if(fX2 < fX){
			let temp = fX;
			fX = fX2;
			fX2 = temp;
		}

		if(fX2 < fLow){
			return null;
		}

		if(fX > fHigh){
			return null;
		}

		fLow = Math.max(fX, fLow);
		fHigh = Math.min(fX2, fHigh);

		if(fLow > fHigh){
			return null;
		}

		//Y
		let fY = (this.cornerA.y - start.y) / (end.y - start.y);
		let fY2 = (this.cornerB.y - start.y) / (end.y - start.y);

		if(fY2 < fY){
			let temp = fY;
			fY = fY2;
			fY2 = temp;
		}

		if(fY2 < fLow){
			return null;
		}

		if(fY > fHigh){
			return null;
		}

		fLow = Math.max(fY, fLow);
		fHigh = Math.min(fY2, fHigh);

		if(fLow > fHigh){
			return null;
		}

		//Z
		let fZ = (this.cornerA.z - start.z) / (end.z - start.z);
		let fZ2 = (this.cornerB.z - start.z) / (end.z - start.z);

		if(fZ2 < fZ){
			let temp = fZ;
			fZ = fZ2;
			fZ2 = temp;
		}

		if(fZ2 < fLow){
			return null;
		}

		if(fZ > fHigh){
			return null;
		}

		fLow = Math.max(fZ, fLow);
		fHigh = Math.min(fZ2, fHigh);

		if(fLow > fHigh){
			return null;
		}

		let ray = new Vector3(end.x - start.x, end.y - start.y, end.z - start.z);

		let result = {
			enterPoint: new Vector3(start.x + ray.x * fLow, start.y + ray.y * fLow, start.z + ray.z * fLow),
			exitPoint: new Vector3(start.x + ray.x * fHigh, start.y + ray.y * fHigh, start.z + ray.z * fHigh)
		}
		return result;
	}

	intersectsAABB(other){
		let aTop = Math.max(this.cornerA.y, this.cornerB.y);
		let aBottom = Math.min(this.cornerA.y, this.cornerB.y);
		let aLeft = Math.min(this.cornerA.x, this.cornerB.x);
		let aRight = Math.max(this.cornerA.x, this.cornerB.x);
		let aFront = Math.max(this.cornerA.z, this.cornerB.z);
		let aBack = Math.min(this.cornerA.z, this.cornerB.z);


		let bTop = Math.max(other.cornerA.y, other.cornerB.y);
		let bBottom = Math.min(other.cornerA.y, other.cornerB.y);
		let bLeft = Math.min(other.cornerA.x, other.cornerB.x);
		let bRight = Math.max(other.cornerA.x, other.cornerB.x);
		let bFront = Math.max(other.cornerA.z, other.cornerB.z);
		let bBack = Math.min(other.cornerA.z, other.cornerB.z);

		if((aLeft <= bRight && aRight >= bLeft) && (aBottom <= bTop && aTop >= bBottom) && (aBack <= bFront && aFront >= bBack)){
			return true;
		}

		return false;
	}
}

export default AABB;