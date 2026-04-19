# Plan: Remove MCP HTTP Endpoint — v1

**Status**: Done
**Created**: 2026-04-19
**Last updated**: 2026-04-19
**Spec**: [.sdd/specs/remove-mcp-http-v1.md]

---

## Summary

Removed MCP HTTP endpoint and related code from the server. Agents connect exclusively via stdio broker-channel.

## Implementation Checklist

- [x] server.ts: removed MCP imports, /mcp routes, session store
- [x] lib/broker-state.ts: removed MCP server registry (mcpServers, registerMcpServer, unregisterMcpServer, notifyAgent)
- [x] Deleted lib/mcp-server.ts
- [x] Build verified — server starts clean
- [x] REST API verified — health, agents work
- [x] Updated ARCHITECTURE.md (v6: Express + stdio broker-channel)
- [x] Updated README.md (removed MCP HTTP references)

---

## Deviations & Notes

- **2026-04-19**: MCP Express/node/server packages kept in dependencies — still needed by src/broker-channel.ts via @modelcontextprotocol/sdk.
