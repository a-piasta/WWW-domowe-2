const bcrypt = require('bcrypt');

class Hasher {
    constructor() {
        this.saltRounds = 1;
    }

    async generateHash(plaintextPasswd) {
        return await bcrypt.hash(plaintextPasswd, this.saltRounds);
    }

    async comparePass(plaintextPasswd, hashedPasswd) {
        return await bcrypt.compare(plaintextPasswd, hashedPasswd);
    }
}

module.exports = Hasher;
