const fs = require('fs');
const path = require('path');

class RotatingFileStream {
    constructor(options) {
        this.filename = options.filename;
        this.maxSize = options.maxSize;
        this.maxFiles = options.maxFiles;
        this.currentSize = 0;
        this.stream = null;
        this.initStream();
    }

    initStream() {
        this.closeStream();
        this.stream = fs.createWriteStream(this.filename, { flags: 'a' });
        
        try {
            const stats = fs.statSync(this.filename);
            this.currentSize = stats.size;
        } catch (err) {
            this.currentSize = 0;
        }
    }

    rotate() {
        this.closeStream();

        for (let i = this.maxFiles - 1; i >= 0; i--) {
            const fromFile = i === 0 ? this.filename : `${this.filename}.${i}`;
            const toFile = `${this.filename}.${i + 1}`;

            try {
                if (fs.existsSync(fromFile)) {
                    fs.renameSync(fromFile, toFile);
                }
            } catch (err) {
                console.error(`日志轮转错误: ${err.message}`);
            }
        }

        this.initStream();
    }

    closeStream() {
        if (this.stream) {
            this.stream.end();
            this.stream = null;
        }
    }

    write(chunk) {
        if (!this.stream) {
            this.initStream();
        }

        this.currentSize += chunk.length;
        if (this.currentSize >= this.maxSize) {
            this.rotate();
        }

        return this.stream.write(chunk);
    }

    end() {
        if (this.stream) {
            this.stream.end();
        }
    }

    get destroyed() {
        return !this.stream || this.stream.destroyed;
    }

    on(event, callback) {
        if (this.stream) {
            this.stream.on(event, callback);
        }
    }
}

function createRotatingLogStream(options) {
    return new RotatingFileStream(options);
}

module.exports = { createRotatingLogStream };