import os
import unittest

import collections
import xmlunittest
import re

re_lm = re.compile(b'lastModified="(\d+?)"')


class FestivalTestCase(unittest.TestCase, xmlunittest.XmlTestMixin):
    def setUp(self):
        from app import get_app
        from api.subsonic import subsonic
        Args = collections.namedtuple('Args', 'with_scanner config debug yes host port check test_regex')
        app = get_app(Args(
            with_scanner=False,
            config=os.path.join(os.path.dirname(__file__), 'test', 'settings.cfg'),
            debug=False,
            yes=False,
            host='0.0.0.0',
            port='5000',
            check=False,
            test_regex=False))
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test/festival.db'
        app.config['TESTING'] = True
        app.register_blueprint(subsonic)
        self.app = app.test_client()

    def tearDown(self):
        pass

    def test_ping(self):
        rv = self.app.get('/rest/ping.view')
        assert rv.status_code == 200

    def test_license(self):
        rv = self.app.get('/rest/getLicense.view')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response version="1.10.1" status="ok" xmlns="http://subsonic.org/restapi">
            <license valid="true"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

    def test_get_music_folders(self):
        rv = self.app.get('/rest/getMusicFolders.view')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response version="1.10.1" status="ok" xmlns="http://subsonic.org/restapi">
            <musicFolders>
                <musicFolder id="1" name="Music"/>
            </musicFolders>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

    def test_get_artists(self):
        rv = self.app.get('/rest/getArtists.view')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response xmlns="http://subsonic.org/restapi" version="1.10.1" status="ok">
            <indexes lastModified="%s" ignoredArticles="">
                <index name="D">
                    <artist name="David TMX" id="AR1"/>
                    <artist name="Diablo Swing Orchestra" id="AR3"/>
                </index>
                <index name="T">
                    <artist name="TheBlackParrot" id="AR4"/>
                </index>
            </indexes>
        </subsonic-response>'''
        # hack to fix lastModified because it's not important value, but otherwise it fails the assertion
        groups = re_lm.search(rv.data)
        self.assertXmlEquivalentOutputs(subject.replace(b'%s', groups.group(1)), rv.data)

    def test_get_music_directory(self):
        rv = self.app.get('/rest/getMusicDirectory.view?id=INVALIDID')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response xmlns="http://subsonic.org/restapi" status="failed" version="1.10.1">
            <error code="10" message="Missing or invalid id"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getMusicDirectory.view?id=AR1')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response xmlns="http://subsonic.org/restapi" status="ok" version="1.10.1">
            <directory id="AR1" name="David TMX">
                <child duration="0" parent="AR1" name="Avant j\'\xc3\xa9tais trappeur" artist="David TMX" artistId="AR1" averageRating="0" coverArt="AL1" id="AL1" title="Avant j\'\xc3\xa9tais trappeur" isDir="true" songCount="0" year="0"/>
            </directory>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getMusicDirectory.view?id=AL1')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response version="1.10.1" status="ok" xmlns="http://subsonic.org/restapi">
            <directory id="AL1" name="Avant j\'\xc3\xa9tais trappeur">
                <child size="5552795" contentType="audio/mpeg" artistId="AR1" title="Avant j\'\xc3\xa9tais trappeur" artist="David TMX" genre="Other" covertArt="AL1" year="0" bitRate="206" type="music" albumId="AL1" track="1" parent="AL1" isDir="false" isVideo="false" id="TR3" duration="213" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="5057761" contentType="audio/mpeg" artistId="AR1" title="La b\xc3\xaate est l\xc3\xa0" artist="David TMX" genre="Rock" covertArt="AL1" year="0" bitRate="234" type="music" albumId="AL1" track="2" parent="AL1" isDir="false" isVideo="false" id="TR10" duration="171" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="3858027" contentType="audio/mpeg" artistId="AR1" title="L\'a\xc3\xa9roplane blind\xc3\xa9" artist="David TMX" genre="Pop" covertArt="AL1" year="0" bitRate="191" type="music" albumId="AL1" track="3" parent="AL1" isDir="false" isVideo="false" id="TR41" duration="159" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="7653499" contentType="audio/mpeg" artistId="AR1" title="Cumshot" artist="David TMX" genre="Rock" covertArt="AL1" year="0" bitRate="218" type="music" albumId="AL1" track="4" parent="AL1" isDir="false" isVideo="false" id="TR14" duration="279" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="4465281" contentType="audio/mpeg" artistId="AR1" title="M\xc3\xa9 j\'suis po un br\xc3\xa9ton !" artist="David TMX" genre="Ska" covertArt="AL1" year="0" bitRate="211" type="music" albumId="AL1" track="5" parent="AL1" isDir="false" isVideo="false" id="TR34" duration="167" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="1821066" contentType="audio/mpeg" artistId="AR1" title="Petit escargot par le 507 rgt de para de Pau" artist="David TMX" genre="Folk" covertArt="AL1" year="0" bitRate="195" type="music" albumId="AL1" track="6" parent="AL1" isDir="false" isVideo="false" id="TR35" duration="72" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="3320782" contentType="audio/mpeg" artistId="AR1" title="Univers lisse" artist="David TMX" genre="Metal" covertArt="AL1" year="0" bitRate="244" type="music" albumId="AL1" track="7" parent="AL1" isDir="false" isVideo="false" id="TR15" duration="107" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="4670390" contentType="audio/mpeg" artistId="AR1" title="Le criterium \xc3\xa0 cran" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="200" type="music" albumId="AL1" track="8" parent="AL1" isDir="false" isVideo="false" id="TR18" duration="185" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="3823048" contentType="audio/mpeg" artistId="AR1" title="Nicht rauchen" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="222" type="music" albumId="AL1" track="9" parent="AL1" isDir="false" isVideo="false" id="TR12" duration="135" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="4848659" contentType="audio/mpeg" artistId="AR1" title="Le g\xc3\xa9nie et le trappeur" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="230" type="music" albumId="AL1" track="10" parent="AL1" isDir="false" isVideo="false" id="TR25" duration="166" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="5986973" contentType="audio/mpeg" artistId="AR1" title="I would like" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="192" type="music" albumId="AL1" track="11" parent="AL1" isDir="false" isVideo="false" id="TR42" duration="247" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="3942757" contentType="audio/mpeg" artistId="AR1" title="Conf\xc3\xa9rie m\xc3\xa9diocritas" artist="David TMX" genre="Metal" covertArt="AL1" year="0" bitRate="233" type="music" albumId="AL1" track="12" parent="AL1" isDir="false" isVideo="false" id="TR7" duration="133" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="2107231" contentType="audio/mpeg" artistId="AR1" title="Les hardcoristes" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="176" type="music" albumId="AL1" track="13" parent="AL1" isDir="false" isVideo="false" id="TR8" duration="93" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="4417715" contentType="audio/mpeg" artistId="AR1" title="TMX, Paris" artist="David TMX" genre="Metal" covertArt="AL1" year="0" bitRate="231" type="music" albumId="AL1" track="14" parent="AL1" isDir="false" isVideo="false" id="TR5" duration="151" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="4804207" contentType="audio/mpeg" artistId="AR1" title="Alava comme j\'te pousse" artist="David TMX" genre="Metal" covertArt="AL1" year="0" bitRate="222" type="music" albumId="AL1" track="15" parent="AL1" isDir="false" isVideo="false" id="TR13" duration="171" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="4811687" contentType="audio/mpeg" artistId="AR1" title="Les maudits m\xc3\xa2les" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="170" type="music" albumId="AL1" track="16" parent="AL1" isDir="false" isVideo="false" id="TR22" duration="224" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="6583031" contentType="audio/mpeg" artistId="AR1" title="Le ridicule ne tue pas" artist="David TMX" genre="Metal" covertArt="AL1" year="0" bitRate="239" type="music" albumId="AL1" track="17" parent="AL1" isDir="false" isVideo="false" id="TR32" duration="218" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="6252810" contentType="audio/mpeg" artistId="AR1" title="4 degr\xc3\xa9s 7" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="219" type="music" albumId="AL1" track="18" parent="AL1" isDir="false" isVideo="false" id="TR30" duration="226" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="2946323" contentType="audio/mpeg" artistId="AR1" title="Bourr\xc3\xa9 de longue date" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="205" type="music" albumId="AL1" track="19" parent="AL1" isDir="false" isVideo="false" id="TR26" duration="113" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="3039485" contentType="audio/mpeg" artistId="AR1" title="L\'envie" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="207" type="music" albumId="AL1" track="20" parent="AL1" isDir="false" isVideo="false" id="TR1" duration="116" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="4145152" contentType="audio/mpeg" artistId="AR1" title="L\'appel de la gazelle" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="215" type="music" albumId="AL1" track="21" parent="AL1" isDir="false" isVideo="false" id="TR17" duration="152" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="5711809" contentType="audio/mpeg" artistId="AR1" title="Pour un monde meilleur" artist="David TMX" genre="Metal" covertArt="AL1" year="0" bitRate="218" type="music" albumId="AL1" track="22" parent="AL1" isDir="false" isVideo="false" id="TR28" duration="207" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="6629954" contentType="audio/mpeg" artistId="AR1" title="John Kaf\xc3\xa9 disjoncte" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="217" type="music" albumId="AL1" track="23" parent="AL1" isDir="false" isVideo="false" id="TR43" duration="242" album="Avant j\'\xc3\xa9tais trappeur"/>
                <child size="3900332" contentType="audio/mpeg" artistId="AR1" title="L\'aube lunaire" artist="David TMX" genre="Unknown" covertArt="AL1" year="0" bitRate="206" type="music" albumId="AL1" track="24" parent="AL1" isDir="false" isVideo="false" id="TR2" duration="149" album="Avant j\'\xc3\xa9tais trappeur"/>
            </directory>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

    def test_get_artist(self):
        rv = self.app.get('/rest/getArtist.view?id=AR0')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response xmlns="http://subsonic.org/restapi" status="failed" version="1.10.1">
            <error message="Artist not found" code="70"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getArtist.view?id=AL1')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response version="1.10.1" status="failed" xmlns="http://subsonic.org/restapi">
            <error message="Missing or invalid Artist id" code="10"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getArtist.view?id=AR1')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response xmlns="http://subsonic.org/restapi" status="ok" version="1.10.1">
            <artist albumCount="1" id="AR1" name="David TMX">
                <album artistId="AR1" id="AL1" artist="David TMX" averageRating="0" coverArt="AL1" name="Avant j\'\xc3\xa9tais trappeur" year="0" songCount="0" duration="0"/>
            </artist>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

    def test_get_album(self):
        rv = self.app.get('/rest/getAlbum.view?id=AL0')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <error message="Album not found" code="70"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getAlbum.view?id=AR0')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response version="1.10.1" status="failed" xmlns="http://subsonic.org/restapi">
            <error code="10" message="Missing or invalid Album id"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getAlbum.view?id=AL1')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="ok" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <album id="AL1" albumCount="24" name="Avant j\'\xc3\xa9tais trappeur">
                <song title="Avant j\'\xc3\xa9tais trappeur" contentType="audio/mpeg" isVideo="false" year="0" track="1" isDir="false" duration="213" artist="David TMX" type="music" size="5552795" id="TR3" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Other" albumId="AL1" parent="AL1" bitRate="206" artistId="AR1"/>
                <song title="La b\xc3\xaate est l\xc3\xa0" contentType="audio/mpeg" isVideo="false" year="0" track="2" isDir="false" duration="171" artist="David TMX" type="music" size="5057761" id="TR10" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Rock" albumId="AL1" parent="AL1" bitRate="234" artistId="AR1"/>
                <song title="L\'a\xc3\xa9roplane blind\xc3\xa9" contentType="audio/mpeg" isVideo="false" year="0" track="3" isDir="false" duration="159" artist="David TMX" type="music" size="3858027" id="TR41" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Pop" albumId="AL1" parent="AL1" bitRate="191" artistId="AR1"/>
                <song title="Cumshot" contentType="audio/mpeg" isVideo="false" year="0" track="4" isDir="false" duration="279" artist="David TMX" type="music" size="7653499" id="TR14" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Rock" albumId="AL1" parent="AL1" bitRate="218" artistId="AR1"/>
                <song title="M\xc3\xa9 j\'suis po un br\xc3\xa9ton !" contentType="audio/mpeg" isVideo="false" year="0" track="5" isDir="false" duration="167" artist="David TMX" type="music" size="4465281" id="TR34" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Ska" albumId="AL1" parent="AL1" bitRate="211" artistId="AR1"/>
                <song title="Petit escargot par le 507 rgt de para de Pau" contentType="audio/mpeg" isVideo="false" year="0" track="6" isDir="false" duration="72" artist="David TMX" type="music" size="1821066" id="TR35" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Folk" albumId="AL1" parent="AL1" bitRate="195" artistId="AR1"/>
                <song title="Univers lisse" contentType="audio/mpeg" isVideo="false" year="0" track="7" isDir="false" duration="107" artist="David TMX" type="music" size="3320782" id="TR15" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Metal" albumId="AL1" parent="AL1" bitRate="244" artistId="AR1"/>
                <song title="Le criterium \xc3\xa0 cran" contentType="audio/mpeg" isVideo="false" year="0" track="8" isDir="false" duration="185" artist="David TMX" type="music" size="4670390" id="TR18" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="200" artistId="AR1"/>
                <song title="Nicht rauchen" contentType="audio/mpeg" isVideo="false" year="0" track="9" isDir="false" duration="135" artist="David TMX" type="music" size="3823048" id="TR12" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="222" artistId="AR1"/>
                <song title="Le g\xc3\xa9nie et le trappeur" contentType="audio/mpeg" isVideo="false" year="0" track="10" isDir="false" duration="166" artist="David TMX" type="music" size="4848659" id="TR25" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="230" artistId="AR1"/>
                <song title="I would like" contentType="audio/mpeg" isVideo="false" year="0" track="11" isDir="false" duration="247" artist="David TMX" type="music" size="5986973" id="TR42" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="192" artistId="AR1"/>
                <song title="Conf\xc3\xa9rie m\xc3\xa9diocritas" contentType="audio/mpeg" isVideo="false" year="0" track="12" isDir="false" duration="133" artist="David TMX" type="music" size="3942757" id="TR7" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Metal" albumId="AL1" parent="AL1" bitRate="233" artistId="AR1"/>
                <song title="Les hardcoristes" contentType="audio/mpeg" isVideo="false" year="0" track="13" isDir="false" duration="93" artist="David TMX" type="music" size="2107231" id="TR8" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="176" artistId="AR1"/>
                <song title="TMX, Paris" contentType="audio/mpeg" isVideo="false" year="0" track="14" isDir="false" duration="151" artist="David TMX" type="music" size="4417715" id="TR5" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Metal" albumId="AL1" parent="AL1" bitRate="231" artistId="AR1"/>
                <song title="Alava comme j\'te pousse" contentType="audio/mpeg" isVideo="false" year="0" track="15" isDir="false" duration="171" artist="David TMX" type="music" size="4804207" id="TR13" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Metal" albumId="AL1" parent="AL1" bitRate="222" artistId="AR1"/>
                <song title="Les maudits m\xc3\xa2les" contentType="audio/mpeg" isVideo="false" year="0" track="16" isDir="false" duration="224" artist="David TMX" type="music" size="4811687" id="TR22" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="170" artistId="AR1"/>
                <song title="Le ridicule ne tue pas" contentType="audio/mpeg" isVideo="false" year="0" track="17" isDir="false" duration="218" artist="David TMX" type="music" size="6583031" id="TR32" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Metal" albumId="AL1" parent="AL1" bitRate="239" artistId="AR1"/>
                <song title="4 degr\xc3\xa9s 7" contentType="audio/mpeg" isVideo="false" year="0" track="18" isDir="false" duration="226" artist="David TMX" type="music" size="6252810" id="TR30" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="219" artistId="AR1"/>
                <song title="Bourr\xc3\xa9 de longue date" contentType="audio/mpeg" isVideo="false" year="0" track="19" isDir="false" duration="113" artist="David TMX" type="music" size="2946323" id="TR26" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="205" artistId="AR1"/>
                <song title="L\'envie" contentType="audio/mpeg" isVideo="false" year="0" track="20" isDir="false" duration="116" artist="David TMX" type="music" size="3039485" id="TR1" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="207" artistId="AR1"/>
                <song title="L\'appel de la gazelle" contentType="audio/mpeg" isVideo="false" year="0" track="21" isDir="false" duration="152" artist="David TMX" type="music" size="4145152" id="TR17" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="215" artistId="AR1"/>
                <song title="Pour un monde meilleur" contentType="audio/mpeg" isVideo="false" year="0" track="22" isDir="false" duration="207" artist="David TMX" type="music" size="5711809" id="TR28" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Metal" albumId="AL1" parent="AL1" bitRate="218" artistId="AR1"/>
                <song title="John Kaf\xc3\xa9 disjoncte" contentType="audio/mpeg" isVideo="false" year="0" track="23" isDir="false" duration="242" artist="David TMX" type="music" size="6629954" id="TR43" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="217" artistId="AR1"/>
                <song title="L\'aube lunaire" contentType="audio/mpeg" isVideo="false" year="0" track="24" isDir="false" duration="149" artist="David TMX" type="music" size="3900332" id="TR2" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" genre="Unknown" albumId="AL1" parent="AL1" bitRate="206" artistId="AR1"/>
            </album>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

    def test_get_song(self):
        rv = self.app.get('/rest/getSong.view?id=AR0')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <error message="Missing or invalid Song id" code="10"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getSong.view?id=TR0')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <error code="70" message="Song not found"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        rv = self.app.get('/rest/getSong.view?id=TR1')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response version="1.10.1" status="ok" xmlns="http://subsonic.org/restapi">
            <song artist="David TMX" id="TR1" title="L\'envie" size="3039485" parent="AL1" genre="Unknown" duration="116" track="20" covertArt="AL1" album="Avant j\'\xc3\xa9tais trappeur" contentType="audio/mpeg" year="0" isVideo="false" isDir="false" artistId="AR1" type="music" bitRate="207" albumId="AL1"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

    # TODO /rest/getRandomSongs.view

    def test_get_album_list(self):
        """
            str             type in ['random', 'newest', 'highest', 'frequent', 'recent', 'starred', 'alphabeticalByName', 'alphabeticalByArtist', 'byYear', 'genre']
            int optionnal   size (default 10)
            int optionnal   offset (default 0)
            int optionnal   fromYear
            int optionnal   toYear
            str optionnal   genre
        """
        # No parameters
        rv = self.app.get('/rest/getAlbumList.view')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" xmlns="http://subsonic.org/restapi" version="1.10.1">
            <error message="Missing parameter type" code="10"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # Parameter type not in whitelist
        rv = self.app.get('/rest/getAlbumList.view?type=whatever')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <error code="0" message="Invalid value whatever for parameter type"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'byYear' and no fromYear parameter
        rv = self.app.get('/rest/getAlbumList.view?type=byYear&toYear=2010')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" xmlns="http://subsonic.org/restapi" version="1.10.1">
            <error message="Missing parameter fromYear or toYear" code="10"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'byYear' and no toYear parameter
        rv = self.app.get('/rest/getAlbumList.view?type=byYear&fromYear=2010')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" xmlns="http://subsonic.org/restapi" version="1.10.1">
            <error message="Missing parameter fromYear or toYear" code="10"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'byYear' and invalid fromYear
        rv = self.app.get('/rest/getAlbumList.view?type=byYear&fromYear=test&toYear=2012')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="ok" xmlns="http://subsonic.org/restapi" version="1.10.1">
            <albumList></albumList>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'genre' and no genre parameter
        rv = self.app.get('/rest/getAlbumList.view?type=genre')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" xmlns="http://subsonic.org/restapi" version="1.10.1">
            <error code="10" message="Missing parameter genre"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # TODO type == 'random'

        # type == 'newest'
        rv = self.app.get('/rest/getAlbumList.view?type=newest')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="ok" xmlns="http://subsonic.org/restapi" version="1.10.1">
            <albumList>
                <album averageRating="0" artist="Diablo Swing Orchestra" songCount="0" parent="AR3" artistId="AR3" duration="0" name="The Butcher\'s Ballroom" coverArt="AL3" title="The Butcher\'s Ballroom" isDir="true" year="0" id="AL3"/>
                <album averageRating="0" artist="David TMX" songCount="0" parent="AR1" artistId="AR1" duration="0" name="Avant j\'\xc3\xa9tais trappeur" coverArt="AL1" title="Avant j\'\xc3\xa9tais trappeur" isDir="true" year="0" id="AL1"/>
                <album averageRating="0" artist="TheBlackParrot" songCount="0" parent="AR4" artistId="AR4" duration="0" name="Identity EP" coverArt="AL4" title="Identity EP" isDir="true" year="0" id="AL4"/>
            </albumList>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'highest'
        rv = self.app.get('/rest/getAlbumList.view?type=highest')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response xmlns="http://subsonic.org/restapi" status="ok" version="1.10.1">
            <albumList>
                <album id="AL1" year="0" coverArt="AL1" artist="David TMX" parent="AR1" songCount="0" duration="0" name="Avant j\'\xc3\xa9tais trappeur" isDir="true" title="Avant j\'\xc3\xa9tais trappeur" artistId="AR1" averageRating="0"/>
                <album id="AL3" year="0" coverArt="AL3" artist="Diablo Swing Orchestra" parent="AR3" songCount="0" duration="0" name="The Butcher\'s Ballroom" isDir="true" title="The Butcher\'s Ballroom" artistId="AR3" averageRating="0"/>
                <album id="AL4" year="0" coverArt="AL4" artist="TheBlackParrot" parent="AR4" songCount="0" duration="0" name="Identity EP" isDir="true" title="Identity EP" artistId="AR4" averageRating="0"/>
            </albumList>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)
        # type == 'frequent'
        rv = self.app.get('/rest/getAlbumList.view?type=frequent')
        self.assertXmlEquivalentOutputs(subject, rv.data)
        # type == 'recent'
        rv = self.app.get('/rest/getAlbumList.view?type=recent')
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'starred'
        rv = self.app.get('/rest/getAlbumList.view?type=starred')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?><subsonic-response xmlns="http://subsonic.org/restapi" version="1.10.1" status="ok"><albumList></albumList></subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'alphabeticalByName'
        rv = self.app.get('/rest/getAlbumList.view?type=alphabeticalByName')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="ok" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <albumList>
                <album name="Avant j\'\xc3\xa9tais trappeur" duration="0" artist="David TMX" artistId="AR1" parent="AR1" title="Avant j\'\xc3\xa9tais trappeur" coverArt="AL1" songCount="0" year="0" averageRating="0" id="AL1" isDir="true"/>
                <album name="Identity EP" duration="0" artist="TheBlackParrot" artistId="AR4" parent="AR4" title="Identity EP" coverArt="AL4" songCount="0" year="0" averageRating="0" id="AL4" isDir="true"/>
                <album name="The Butcher\'s Ballroom" duration="0" artist="Diablo Swing Orchestra" artistId="AR3" parent="AR3" title="The Butcher\'s Ballroom" coverArt="AL3" songCount="0" year="0" averageRating="0" id="AL3" isDir="true"/>
            </albumList>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # type == 'alphabeticalByArtist'
        rv = self.app.get('/rest/getAlbumList.view?type=alphabeticalByArtist')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response version="1.10.1" status="ok" xmlns="http://subsonic.org/restapi">
            <albumList>
                <album parent="AR1" averageRating="0" artist="David TMX" year="0" artistId="AR1" songCount="0" isDir="true" name="Avant j\'\xc3\xa9tais trappeur" id="AL1" title="Avant j\'\xc3\xa9tais trappeur" coverArt="AL1" duration="0"/>
                <album parent="AR3" averageRating="0" artist="Diablo Swing Orchestra" year="0" artistId="AR3" songCount="0" isDir="true" name="The Butcher\'s Ballroom" id="AL3" title="The Butcher\'s Ballroom" coverArt="AL3" duration="0"/>
                <album parent="AR4" averageRating="0" artist="TheBlackParrot" year="0" artistId="AR4" songCount="0" isDir="true" name="Identity EP" id="AL4" title="Identity EP" coverArt="AL4" duration="0"/>
            </albumList>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # TODO size & offset

    def test_get_album_list2(self):
        # type == 'newest'
        rv = self.app.get('/rest/getAlbumList2.view?type=newest')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="ok" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <albumList2>
                <album averageRating="0" artistId="AR3" songCount="0" artist="Diablo Swing Orchestra" name="The Butcher\'s Ballroom" duration="0" id="AL3" year="0" coverArt="AL3"/>
                <album averageRating="0" artistId="AR1" songCount="0" artist="David TMX" name="Avant j\'\xc3\xa9tais trappeur" duration="0" id="AL1" year="0" coverArt="AL1"/>
                <album averageRating="0" artistId="AR4" songCount="0" artist="TheBlackParrot" name="Identity EP" duration="0" id="AL4" year="0" coverArt="AL4"/>
            </albumList2>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

    def test_search2(self):  # Also valid for search3
        """
            str             query
            int optionnal   artistCount (default 20)
            int optionnal   artistOffset (default 0)
            int optionnal   albumCount (default 20)
            int optionnal   albumOffset (default 0)
            int optionnal   songCount (default 20)
            int optionnal   songOffset (default 0)
        """
        # No query parameter
        rv = self.app.get('/rest/search2.view')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="failed" xmlns="http://subsonic.org/restapi" version="1.10.1">
            <error code="10" message="Missing query parameter"/>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)

        # query == 'The'
        # TODO Order of album/artist doesn't matter, so assertXmlEquivalentOutputs can't be used
        '''
        rv = self.app.get('/rest/search2.view?query=The')
        subject = b' ''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response status="ok" version="1.10.1" xmlns="http://subsonic.org/restapi">
            <searchResult2>
                <album coverArt="AL3" duration="0" id="AL3" artist="Diablo Swing Orchestra" artistId="AR3" year="0" songCount="0" name="The Butcher\'s Ballroom" averageRating="0"/>
                <artist albumCount="0" name="TheBlackParrot" id="AR4"/>
                <track contentType="audio/mpeg" albumId="AL4" size="10377631" id="TR20" track="1" year="0" parent="AL4" type="music" bitRate="208" isVideo="false" isDir="false" duration="396" artist="TheBlackParrot" album="Identity EP" artistId="AR4" title="TheBlackParrot - High Hopes" covertArt="AL4"/>
                <track contentType="audio/mpeg" albumId="AL4" size="7012491" id="TR37" track="2" year="0" parent="AL4" type="music" bitRate="202" isVideo="false" isDir="false" duration="276" artist="TheBlackParrot" album="Identity EP" artistId="AR4" title="TheBlackParrot - Identity" covertArt="AL4"/>
                <track contentType="audio/mpeg" albumId="AL4" size="3871594" id="TR33" track="3" year="0" parent="AL4" type="music" bitRate="195" isVideo="false" isDir="false" duration="157" artist="TheBlackParrot" album="Identity EP" artistId="AR4" title="TheBlackParrot - Abandon Everything" covertArt="AL4"/>
                <track contentType="audio/mpeg" albumId="AL4" size="6053025" id="TR31" track="4" year="0" parent="AL4" type="music" bitRate="182" isVideo="false" isDir="false" duration="263" artist="TheBlackParrot" album="Identity EP" artistId="AR4" title="TheBlackParrot - Struggle" covertArt="AL4"/>
                <track contentType="audio/mpeg" albumId="AL4" size="9970079" id="TR23" track="5" year="0" parent="AL4" type="music" bitRate="206" isVideo="false" isDir="false" duration="385" artist="TheBlackParrot" album="Identity EP" artistId="AR4" title="TheBlackParrot - Divergence (Remastered VIP)" covertArt="AL4"/>
                <track contentType="audio/mpeg" albumId="AL4" size="9567976" id="TR19" track="6" year="0" parent="AL4" type="music" bitRate="216" isVideo="false" isDir="false" duration="352" artist="TheBlackParrot" album="Identity EP" artistId="AR4" title="TheBlackParrot - Bandit (Album Mix)" covertArt="AL4"/>
            </searchResult2>
        </subsonic-response>'' '
        self.assertXmlEquivalentOutputs(subject, rv.data)
        '''

        # query == 'NOTHING'
        rv = self.app.get('/rest/search2.view?query=NOTHING')
        subject = b'''<?xml version="1.0" encoding="UTF-8"?>
        <subsonic-response xmlns="http://subsonic.org/restapi" status="ok" version="1.10.1">
            <searchResult2></searchResult2>
        </subsonic-response>'''
        self.assertXmlEquivalentOutputs(subject, rv.data)


# TODO /rest/getCoverArt.view
# TODO /rest/download.view

if __name__ == '__main__':
    unittest.main()
