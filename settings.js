module.exports = {
    mongodb: {
        url: 'mongodb://localhost/webmusic'
    },
    express: {
        port: 3000
    },
    scanner: {
        path: '/path/to/music',
        exts: 'mp3,ogg'
    },
    debug: {
        debug: true
    },
    cache: {
        maxitems: 1000
    },
    soundmanager: {
        url: 'swf/',
        flashVersion: 9,
        useFlashBlock: 'false',
        useHTML5Audio: 'true',
        preferFlash: 'false'
    }
};

