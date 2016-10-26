import io
import logging
import os

from PIL import Image

from .data import Data

logger = logging.getLogger('thumbs')


class Thumb(Data):

    NAME = 'thumbs'

    def create(self, fd, newname):
        self.mkdirp(Thumb.NAME)
        save_to = os.path.join(self.getdir(), "%s.jpg" % newname)
        try:
            data = io.BytesIO(fd.data) if hasattr(fd, 'data') else fd
            img = Image.open(data)
            img.thumbnail((220, 220))
            img.save(save_to, "JPEG", quality=80, optimize=True, progressive=True)
            return save_to
        except IOError:
            logger.exception('Cannot create thumbnail')
            return None

    @staticmethod
    def getdir(name=None):
        if name is None:
            name = Thumb.NAME
        return os.path.join(Data.DIR, name)
