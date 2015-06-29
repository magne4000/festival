Festival
========
Festival is an HTML5 web application that can play music files.  
It also implements a piece of subsonic api which allows subsonic client apps to connect (like android apps) !

![Webmusic screenshot](https://github.com/magne4000/magne4000.github.com/raw/master/images/festival.screen1.jpg)

[Live demo !](http://getonmyhor.se:3000/)

Dependencies (ubuntu)
---------------------
Install Flask with SQLAlchemy, and python3-imaging

    sudo apt-get install python3-flask python3-sqlalchemy python3-flask-sqlalchemy python3-imaging

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

and optionally

    rm -fr data/*

Configuration
-------------
In order to configure the app, you need to create a custom `settings-user.js` file:

    cp settings.js settings-user.js

In the newly created file `settings-user.js`, the only value that really needs to be modified is the path where your musics are stored:

    scanner: {
        path: '</path/to/your/musics/>',
        ...
    }

Launch
------
You are now ready to launch the app. Just launch the following command to do so:

    node app.js

Subsonic
--------
Subsonic client apps can be plugged to Festival. You just need to add it like any other server to your app.
As it doesn't support login, if your app requires login/password, just fill credentials with random letters.

License
-------
MIT License

Copyright © 2014-2015 Joël Charles

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
