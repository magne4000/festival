Festival
========
Festival is an HTML5 web application that can play music files with the help of NodeJS.  
The app relies on a MongoDB database.

![Webmusic screenshot](https://github.com/magne4000/magne4000.github.com/raw/master/images/festival.screen1.jpg)

[Live demo !](http://getonmyhor.se:3000/)

Dependencies (ubuntu)
---------------------
First of all, add mongodb and nodejs repositories to apt (more recent than default ones)

    sudo add-apt-repository ppa:chris-lea/node.js
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
    sudo apt-get update

Then install nodejs, mongodb, taglib and graphicsmagick

    sudo apt-get install nodejs mongodb-org libtag1-dev libtag1c2a libtag1-vanilla graphicsmagick git build-essential

Taglib installation (other systems)
-----------------------------------
[Taglib](http://taglib.github.io/) must be build using cmake on other distros:

    wget http://taglib.github.io/releases/taglib-1.9.1.tar.gz
    tar xavf taglib-1.9.1.tar.gz
    cd taglib-1.9.1
    cmake .
    make
    make install

Installation
------------
Clone the project

    git clone https://github.com/magne4000/festival.git

And install dependencies

    cd festival
    npm install

Update
------------
    git pull
    npm update

Configuration
-------------
In order to configure the app, you need to customize settings.js file.

The only value that really needs to be modified is the path where your musics are stored:

    scanner: {
        path: '</path/to/your/musics/>',
        ...
    }

Launch
------
You are now ready to launch the app. Just launch the following command to do so:

    node app.js

License
-------
MIT License

Copyright © 2014 Joël Charles

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
