import pathlib, sys, json, time
from http.server import BaseHTTPRequestHandler, HTTPServer

class handler(BaseHTTPRequestHandler):
    # Silence the default log messages
    def log_message(self, format, *args):
        return

    def do_GET(self):
        print(f"{time.ctime()} - answering GET request for {self.path}")

        reqPath = pathlib.Path(self.path[1:])

        reply, rc = f'{{"err": "wrong path {self.path}"}}', 404
        if self.path == "/":
            reply, rc = self.handleHealth()

        self.send_response(rc)
        self.send_header('Content-type','application/json')
        self.end_headers()

        self.wfile.write(bytes(reply, "utf8"))

    def handleHealth(self):
        return '{"msg": "looking fine!"}', 200

    def do_POST(self):
        print(f"{time.ctime()} - answering POST request for {self.path}")

        reply, rc = f'{{"err": "wrong path {self.path}"}}', 404
        if self.path == "/metrics":
            reply, rc = self.handleMetrics()
        elif self.path == "/metric-payload-options":
            reply, rc = self.handleMetricPayloadOptions()

        self.send_response(rc)
        self.send_header('Content-Type','application/json')
        self.end_headers()

        self.wfile.write(bytes(reply, "utf8"))

    def tryReadBody(self):
        bodyLen = int(self.headers.get('content-length'))
        if bodyLen > 0:
            return json.loads(self.rfile.read().decode("utf-8"))
        return None

    # Check https://github.com/pcolladosoto/gtom-native/blob/main/README.md 
    def handleMetrics(self):
        return pathlib.Path("./metrics.json").read_text(), 200

    # Check https://github.com/pcolladosoto/gtom-native/blob/main/README.md 
    def handleMetricPayloadOptions(self):
        return pathlib.Path("./metric-payload-options.json").read_text(), 200

def main():
    print("began listening on 0.0.0.0:8080")
    try:
        with HTTPServer(('', 8080), handler) as server:
            server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)

if __name__ == "__main__":
    main()
