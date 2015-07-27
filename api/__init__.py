from flask import request, Response
from flask.json import jsonify
from app import app

from xml.dom.minidom import Text

DEFAULT_VERSION='1.10.1'

def dict2xml(d, root_node=None):
    wrap = False if None == root_node or isinstance(d, list) else True
    root = 'objects' if None == root_node else root_node
    root_singular = root[:-1] if 's' == root[-1] and None == root_node else root
    xml = ''
    children = []

    if isinstance(d, dict):
        for key, value in dict.items(d):
            if isinstance(value, dict):
                children.append(dict2xml(value, key))
            elif isinstance(value, list):
                children.append(dict2xml(value, key))
            else:
                t = Text()
                t.data = str(value)
                if isinstance(value, bool):
                    t.data = t.data.lower()
                xml = '{} {}="{}"'.format(xml, key, t.toxml())
    else:
        for value in d:
            children.append(dict2xml(value, root_singular))

    end_tag = '>' if 0 < len(children) else '/>'

    if wrap or isinstance(d, dict):
        xml = "<{}{}{}".format(root, xml, end_tag)

    if 0 < len(children):
        for child in children:
            xml = "{}{}".format(xml, child)

        if wrap or isinstance(d, dict):
            xml = "{}</{}>".format(xml, root)

    return xml

def clean(d):
    for key, value in d.items():
        if isinstance(value, dict):
            d[key] = clean(value)
        elif isinstance(value, list):
            if len(value) == 0:
                del d[key]
            else:
                d[key] = [clean(item) if isinstance(item, dict) else item for item in value]
    return d

def jsonresponse(resp, error=False, version=DEFAULT_VERSION):
    resp = clean(resp)
    resp.update({
        'status': 'failed' if error else 'ok',
        'version': version,
        'xmlns': "http://subsonic.org/restapi"
    })
    return jsonify({'subsonic-response': resp})

def jsonpresponse(resp, callback, error=False, version=DEFAULT_VERSION):
    return "{}({})".format(callback, jsonresponse(resp, error, version))

def xmlresponse(resp, error=False, version=DEFAULT_VERSION):
    resp.update({
        'status': 'failed' if error else 'ok',
        'version': version,
        'xmlns': "http://subsonic.org/restapi"
    })

    output = dict2xml(resp, "subsonic-response")

    return Response("{}{}".format('<?xml version="1.0" encoding="UTF-8"?>', output), content_type='text/xml; charset=utf-8')

@app.before_request
def subsonicify():
    if not request.path.endswith('.view'):
        return

    """Return a function to create the response."""
    f = request.args.get('f')
    callback = request.args.get('callback')
    if f == 'jsonp':
        # Some clients (MiniSub, Perisonic) set f to jsonp without callback for streamed data
        if not callback and request.endpoint not in [ 'stream_media', 'cover_art' ]:
            return jsonresponse({
                'error': {
                    'code': 0,
                    'message': 'Missing callback'
                }
            }, error = True), 400
        request.formatter = lambda x, **kwargs: jsonpresponse(x, callback, kwargs)
    elif f == "json":
        request.formatter = jsonresponse
    else:
        request.formatter = xmlresponse

    request.error_formatter = lambda code, msg: request.formatter({ 'error': { 'code': code, 'message': msg } }, error = True)

@app.after_request
def set_content_type(response):
    if not request.path.endswith('.view'):
        return response

    if response.mimetype.startswith('text'):
        f = request.args.get('f')
        response.headers['content-type'] = 'application/json' if f in [ 'jsonp', 'json' ] else 'text/xml'

    return response

@app.errorhandler(404)
def not_found(error):
    if not request.path.endswith('.view'):
        return error

    return request.error_formatter(0, 'Not implemented'), 501

from .subsonic import *