# Plan: Agent Bridge Channel — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/agent-bridge-channel-v1.md]

---

## Summary

Claude Code 세션 간 양방향 HTTP 통신을 위한 커스텀 Channel MCP 서버를 Node.js + TypeScript로 구현한다. 각 세션이 자체 HTTP 서버를 실행하고, MCP stdio를 통해 Claude Code와 연결되며, 상대 세션의 포트로 HTTP POST를 보내 메시지를 교환한다.

## Technical Context

| Item              | Value                                          |
|-------------------|------------------------------------------------|
| Language          | TypeScript (Node.js v25+)                      |
| Key dependencies  | `@modelcontextprotocol/sdk`                    |
| Files to create   | `src/bridge-channel.ts`, `src/types.ts`, `tsconfig.json`, `package.json` |
| Files to modify   | `.mcp.json`                                    |

---

## Implementation Checklist

### Phase 1 — Interface

- [x] Read spec document and confirm no open questions remain
- [x] Define types in `src/types.ts`: ChannelConfig, BridgeMessage, ReplyArgs
- [x] Review types with the spec — no invented properties

### Phase 2 — Testing

- [x] Write test: HTTP POST → MCP notification 발행 확인
- [x] Write test: reply tool 호출 → 대상 포트로 HTTP POST 전송 확인
- [x] Write test: 잘못된 요청(빈 body, 잘못된 method) 처리 확인
- [x] Write test: 대상 서버 미실행 시 reply 에러 처리 확인

### Phase 3 — Implementation

- [x] `src/bridge-channel.ts` 구현: MCP Server + HTTP listener + reply tool
- [x] `.mcp.json` 설정 파일 작성
- [x] All tests pass (5/5)

### Phase 4 — Docs

- [x] Update this plan with any deviations
- [x] Update `.sdd/design.md` if new patterns were introduced

---

## Deviations & Notes

- **2026-04-19**: `BridgeMessage` 타입은 실제로 HTTP 레벨에서 header(`x-sender-port`) + body로 분리되어 전달됨. 별도 JSON wrapping 없이 plain text body + header 방식 채택.
- **2026-04-19**: `/reply` HTTP 엔드포인트 추가 — MCP reply tool 외에 standalone HTTP 테스트를 위한 프록시 경로.
