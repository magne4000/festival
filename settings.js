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
    lastfm: {
        api_key: 'd9ba5638b0b058105af31af8c6a4b252'
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

