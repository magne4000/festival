module.exports = {
    mongodb: {
        url: 'mongodb://localhost/webmusic'
    },
    express: {
        port: 3000
    },
    scanner: {
        path: '/share/FTP/Musique',
        exts: '.mp3,.ogg'
    },
    debug: {
        debug: true
    },
    soundmanager: {
        url: 'swf/',
        flashVersion: 9,
        useFlashBlock: 'false',
        useHTML5Audio: 'true',
        preferFlash: 'false'
    }
};

