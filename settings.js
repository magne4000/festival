module.exports = {
    mongodb: {
        url: 'mongodb://localhost/festival'
    },
    express: {
        port: 3000
    },
    scanner: {
        path: '/share/FTP/Musique',
        musicExts: '.mp3,.ogg',
        coverExts: '.png,.jpg,.jpeg,.gif'
    },
    debug: {
        debug: false
    },
    soundmanager: {
        url: 'swf/',
        flashVersion: 9,
        useFlashBlock: 'false',
        useHTML5Audio: 'true',
        preferFlash: 'false'
    }
};

