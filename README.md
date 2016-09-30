[![Build Status](https://travis-ci.org/magne4000/festival.svg?branch=master)](https://travis-ci.org/magne4000/festival)

# Festival 2.0
Your personnal, self-hosted, online music player. [Live demo !](http://getonmyhor.se/festival-demo/)

![Webmusic screenshot](https://github.com/magne4000/magne4000.github.com/raw/master/images/festival.screen1.jpg)

## Android client
As Festival implements a piece of subsonic api, it allows subsonic client apps to connect, like [DSub](https://github.com/daneren2005/Subsonic) !

## Installation

Clone the project
```bash
git clone https://github.com/magne4000/festival.git
```
Festival needs Python 3.4 or greater in order to run.

### Dependencies using PIP
```bash
pip3 install -r requirements.txt
```

### Dependencies (ubuntu 16.04)
Install Flask, SQLAlchemy and other python3 dependencies
```bash
sudo apt-get install python3-flask python3-sqlalchemy python3-pil python3-urllib3 python3-mutagen python3-libsass
```
If you want to use MySQL instead of SQLite, you can also install `python3-mysql.connector`, and configure `SQLALCHEMY_DATABASE_URI` in `settings.cfg` file.

### Update
```bash
git pull
python3 festival.py check
```

### Configuration
You can configure the app automatically on first launch:
```bash
python3 festival.py check
```
It'll create the `settings.cfg` file and prompt for mandatory values.

Otherwise, you can manually create a custom `settings.cfg` file:
```bash
cp settings.sample.cfg settings.cfg
```
In the newly created file `settings.cfg`, it is necessary to update the value of `SCANNER_PATH`:
```python
SCANNER_PATH = '</path/to/your/musics/>'
```

It is also recommended to check all other parameters.

### Startup
#### First startup
If `SCANNER_FOLDER_PATTERNS` is activated in configuration (it is the default behavior), it is recommended to test the patterns with the following command:
```bash
python3 festival.py test-regex
```
#### Standalone
You can launch Festival in standalone mode. Just launch the following command to do so:
```bash
python3 festival.py start --with-scanner
```
Now, the webserver is running (by default on port 5000), and the scanner also runs in background.

#### Web Server
In order to run behind a web server, Festival can be launched through uWSGI
```bash
sudo apt-get install uwsgi uwsgi-plugin-python3
```

To start uwsgi process manually
```bash
cd /path/to/festival
uwsgi --ini festival.uwsgi
```

In order to start it automatically, refer to [startup scripts](#startup-scripts)

##### Apache
Install mod-proxy-uwsgi:
```bash
sudo apt-get install libapache2-mod-proxy-uwsgi
```

Then, add this into one Apache VirtualHost
```apache
ProxyPass /festival uwsgi://127.0.0.1:15500/
```

##### nginx
Add those line into one of your `server { ... }` block
```nginx
rewrite ^[/]festival$ /festival/ permanent;
location /festival {
  rewrite /festival/(.*) /$1 break;
  include uwsgi_params;
  uwsgi_param SCRIPT_NAME /festival;
  uwsgi_modifier1 30;
  uwsgi_pass 127.0.0.1:15500;
}
```

#### Startup scripts
##### Systemd
```bash
sudo cp scripts/festival.systemd.conf /etc/systemd/system/festival.service
```
Then edit `/etc/systemd/system/festival.service` and replace values between `{}`.

##### Upstart
```bash
sudo cp scripts/festival.upstart.conf /etc/init/festival.conf
```
Then edit `/etc/init/festival.conf` and replace values between `{}`.

### subsonic
Subsonic client apps can be plugged to Festival. You just need to add it like any other server to your app.
As it doesn't support login, if your app requires login/password, just fill credentials with random letters.

### Testing
```bash
pip3 install xmlunittest
```

### License
MIT License

Copyright © 2014-2016 Joël Charles

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
