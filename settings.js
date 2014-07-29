module.exports = {
    nedb: {
        dir: 'data/db/',
        dbs: {
            track: 'track',
            albumart: 'albumart'
        }
    },
    express: {
        port: 3001
    },
    scanner: {
        path: '/mnt/data/musique',
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

