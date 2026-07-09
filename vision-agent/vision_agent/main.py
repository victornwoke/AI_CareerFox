from __future__ import annotations

import logging

import uvicorn


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    uvicorn.run(
        "vision_agent.server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )


if __name__ == "__main__":
    main()
