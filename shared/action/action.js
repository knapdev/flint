'use strict';

class Action{
    progress = 0;
    duration = 0;
    
    isComplete = false;

    events = {};

    constructor(){
        this.events['started'] = [];
        this.events['progress'] = [];
        this.events['completed'] = [];
        this.events['cancelled'] = [];
    }

    tick(delta){
        this.progress += delta;
        this.emit('progress', this.progress);
        if(this.progress >= this.duration){
            this.execute();
            this.emit('completed');
            this.isComplete = true;
        }
    }

    cancel(){
        this.emit('cancelled');
        this.isCancelled = true;
    }

    execute(){

    }

    on(type, callback){
        this.events[type].push({
			once: false,
			callback: callback
		});
    }

    once(type, callback){
		this.events[type].push({
			once: true,
			callback: callback
		});
    }
    
    ignore(type, callback){
		this.events[type].splice(this.events[type].indexOf(callback), 1);
	}

	emit(type, args){
		for(let i in this.events[type]){
			this.events[type][i].callback(args);
			if(this.events[type][i].once){
				this.ignore(type, this.events[type][i].callback);
			}
		}
	}
}

export default Action;