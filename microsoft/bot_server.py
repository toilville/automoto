from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, HTTPServer

from microsoft.adapters.bot_adapter import BotAdapter


class BotHandler(BaseHTTPRequestHandler):
    adapter = BotAdapter()

    def _write_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):  # noqa: N802
        if self.path != "/api/messages":
            self._write_json({"error": "not found"}, status=404)
            return

        size = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(size).decode("utf-8")) if size else {}

        tool_name = payload.get("tool", "recommend")
        parameters = payload.get("parameters", {})
        result = self.adapter.handle_tool_call(tool_name, parameters)
        self._write_json(result)


def main() -> None:
    server = HTTPServer(("0.0.0.0", 3978), BotHandler)
    print("microsoft bot server listening on :3978")
    server.serve_forever()


if __name__ == "__main__":
    main()
