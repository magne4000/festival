import io
import os
import logging
from PIL import Image
from .data import Data

logger = logging.getLogger('thumbs')

class Thumb(Data):

    NAME = 'thumbs'

    def create(self, fd, newname):
        self.mkdirp(Thumb.NAME)
        save_to = os.path.join(self.getdir(), "%s.jpg" % newname)
        try:
            img = Image.open(io.BytesIO(fd.read()))
            img.thumbnail((140, 140))
            img.save(save_to, "JPEG")
            return save_to
        except IOError:
            logger.exception('Cannot create thumbnail')
            return None

    @staticmethod
    def getdir(name=None):
        if name is None:
            name = Thumb.NAME
        return os.path.join(Data.DIR, name)
