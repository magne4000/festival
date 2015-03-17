module.exports = {
    debug: false,
    mongodb: {
        uri: 'mongodb://localhost/festival'
    },
    express: {
        port: 3001
    },
    lastfm: {
        api_key: 'd9ba5638b0b058105af31af8c6a4b252'
    },
    scanner: {
        path: '/mnt/data/musique',
        musicExts: '.mp3,.ogg'
    },
    soundmanager: {
        url: 'swf/',
        flashVersion: 9,
        useFlashBlock: 'false',
        useHTML5Audio: 'true',
        preferFlash: 'false'
    }
};

