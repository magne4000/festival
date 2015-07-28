festival_home='/path/to/festival'

import sys, os
sys.path.insert(0, festival_home)
os.chdir(festival_home)

from festival import app as application
from scanner import Scanner

Scanner(application.config['SCANNER_PATH']).start()
