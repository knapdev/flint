'use strict';

import mongojs from 'mongojs';

class Database{
    root = null;
    constructor(){
        this.root = mongojs('localhost:27017/flint', ['accounts']);
    }

    authenticate(username, password, callback){
        this.root.accounts.findOne({username: username, password: password}, (err, res) => {
            if(res == null){
                callback(false);
            }else{
                callback(true);
            }
        });
    }

    usernameTaken(username, callback){
        this.root.accounts.findOne({username: username}, (err, res) => {
            if(res == null){
                callback(false);
            }else{
                callback(true);
            }
        });
    }

    registerAccount(username, password, callback){
        this.usernameTaken(username, (res) => {
            if(res == true){
                callback(false);
            }else{
                this.root.accounts.insert({username: username, password: password}, (err) => {
                    callback(true);
                });
            }
        });
    }
}

const instance = new Database();
Object.freeze(instance);

export default instance;