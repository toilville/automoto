from __future__ import annotations

import argparse
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any, Dict

from microsoft import core
from microsoft.adapters.foundry_adapter import FoundryAdapter
from microsoft.settings import Settings


def run_recommend(args: argparse.Namespace) -> Dict[str, Any]:
    interests = core.normalize_interests(args.interests)
    return {"recommendations": core.recommend(interests, top=args.top)}


def run_explain(args: argparse.Namespace) -> Dict[str, Any]:
    interests = core.normalize_interests(args.interests)
    return {"explanation": core.explain(args.title, interests)}


class StarterHandler(BaseHTTPRequestHandler):
    def _write_json(self, payload: Dict[str, Any], status: int = 200) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802
        if self.path == "/health":
            self._write_json({"status": "ok", "service": "microsoft-starter"})
            return
        self._write_json({"error": "not found"}, status=404)

    def do_POST(self):  # noqa: N802
        if self.path != "/recommend":
            self._write_json({"error": "not found"}, status=404)
            return

        content_length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(content_length) if content_length else b"{}"
        payload = json.loads(raw.decode("utf-8"))

        interests = payload.get("interests", [])
        top = int(payload.get("top", 3))
        recommendations = core.recommend(interests=interests, top=top)
        self._write_json({"recommendations": recommendations})


def run_server(args: argparse.Namespace) -> None:
    server = HTTPServer(("0.0.0.0", args.port), StarterHandler)
    print(f"microsoft starter server listening on :{args.port}")
    server.serve_forever()


def run_foundry_check(_: argparse.Namespace) -> Dict[str, Any]:
    settings = Settings()
    adapter = FoundryAdapter(settings=settings, model_deployment=settings.foundry_model_deployment)
    return {
        "foundry_enabled": settings.foundry_enabled,
        "foundry_ready": settings.validate_foundry_ready(),
        "errors": settings.get_foundry_errors(),
        "agent_runtime_initialized": adapter.agent is not None,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Microsoft generic Foundry starter agent")
    sub = parser.add_subparsers(dest="command", required=True)

    recommend = sub.add_parser("recommend", help="Recommend items for interests")
    recommend.add_argument("--interests", required=True, help="Comma-separated interests")
    recommend.add_argument("--top", type=int, default=3)

    explain = sub.add_parser("explain", help="Explain a specific item")
    explain.add_argument("--title", required=True)
    explain.add_argument("--interests", default="")

    serve = sub.add_parser("serve", help="Run local HTTP server")
    serve.add_argument("--port", type=int, default=8010)

    sub.add_parser("check-foundry", help="Check Foundry configuration and runtime")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "recommend":
        print(json.dumps(run_recommend(args), indent=2))
        return
    if args.command == "explain":
        print(json.dumps(run_explain(args), indent=2))
        return
    if args.command == "serve":
        run_server(args)
        return
    if args.command == "check-foundry":
        print(json.dumps(run_foundry_check(args), indent=2))
        return

    parser.print_help()


if __name__ == "__main__":
    main()
