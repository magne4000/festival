import os

class Data:

    DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'data'))

    @staticmethod
    def mkdirp(name):
        newdir = Data.getdir(name)
        if not os.path.isdir(newdir):
            os.makedirs(newdir)

    @staticmethod
    def getdir(name):
        return os.path.join(Data.DIR, name)
