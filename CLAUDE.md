# Agent Bridge Channel

Claude Code 세션 간 양방향 통신을 구현하는 커스텀 Channel MCP 서버 PoC.

## Tech Stack

- Runtime: Node.js (v25+)
- Language: TypeScript
- Protocol: MCP (Model Context Protocol) over stdio
- Transport: HTTP (localhost) for inter-session messaging

## Architecture

```
Session A (port 8001)                    Session B (port 8002)
  Claude ←stdio→ bridge MCP ──HTTP POST→ bridge MCP ←stdio→ Claude
  Claude ←stdio→ bridge MCP ←HTTP POST── bridge MCP ←stdio→ Claude
```

각 세션은 자체 channel MCP 서버를 실행하며, 상대 세션의 HTTP 포트로 메시지를 전송한다.

## Development Guide

- 개발 언어는 한국어로 소통한다.
- SDD(Spec-Driven Development) 워크플로우를 따른다: specify → plan → interface → test → implement → update docs
- 코드 작성 시 `.sdd/` 디렉토리에 스펙과 플랜을 먼저 작성한다.
- 테스트는 구현 전에 작성한다.
- `--dangerously-load-development-channels` 플래그로 개발 중인 채널을 테스트한다.
