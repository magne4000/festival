import io
import os
import PIL
import sys
import traceback
from PIL import Image

from .data import Data

class Thumb(Data):
    
    NAME = 'thumbs'
    
    def create(self, fd, newname):
        self.mkdirp(Thumb.NAME)
        save_to = os.path.join(self.getdir(Thumb.NAME), "%s.jpg" % newname)
        try:
            img = Image.open(io.BytesIO(fd.read()))
            img.thumbnail((140, 140))
            img.save(save_to, "JPEG")
            return save_to
        except IOError:
            print("Cannot create thumbnail")
            print(traceback.format_exc(), file=sys.stderr)
            return None