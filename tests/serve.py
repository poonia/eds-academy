#!/usr/bin/env python3
"""Serves the repo the way GitHub Pages does: under /eds-academy/, with 404.html for missing paths."""
import http.server, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PREFIX = '/eds-academy/'


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split('?')[0].split('#')[0]
        if not path.startswith(PREFIX):
            return self.not_found()
        relative = path[len(PREFIX):] or 'index.html'
        target = ROOT / relative
        if not target.is_file():
            return self.not_found()
        self.path = '/' + relative
        return super().do_GET()

    def not_found(self):
        body = (ROOT / '404.html').read_bytes()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
