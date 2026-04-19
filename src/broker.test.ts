import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { ChildProcess } from "node:child_process";

const BROKER_PORT = 18100;
const BASE = `http://127.0.0.1:${BROKER_PORT}`;

function request(
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: () => Promise<unknown>; text: () => Promise<string> }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: body ? { "content-type": "application/json" } : {},
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            json: async () => JSON.parse(data),
            text: async () => data,
          })
        );
      }
    );
    req.on("error", reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
}

describe("central broker", () => {
  let brokerProcess: ChildProcess;

  before(async () => {
    const { spawn } = await import("node:child_process");
    brokerProcess = spawn("node", ["dist/broker.js"], {
      env: { ...process.env, BROKER_PORT: String(BROKER_PORT) },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // 서버 대기
    await new Promise<void>((resolve) => {
      const check = () => {
        const req = http.request(
          { hostname: "127.0.0.1", port: BROKER_PORT, method: "GET", path: "/health" },
          (res) => { res.resume(); resolve(); }
        );
        req.on("error", () => setTimeout(check, 100));
        req.end();
      };
      check();
    });
  });

  after(() => {
    brokerProcess?.kill();
  });

  it("health check 응답", async () => {
    const res = await request("GET", "/health");
    assert.equal(res.status, 200);
  });

  it("agent 등록", async () => {
    const res = await request("POST", "/register", {
      agentId: "agent-a",
      displayName: "리서처",
    });
    assert.equal(res.status, 200);
  });

  it("중복 등록은 displayName 덮어쓰기 (idempotent)", async () => {
    await request("POST", "/register", {
      agentId: "agent-a",
      displayName: "리서처v2",
    });
    const res = await request("GET", "/agents");
    const agents = (await res.json()) as Array<{ agentId: string; displayName: string }>;
    const a = agents.find((x) => x.agentId === "agent-a");
    assert.equal(a?.displayName, "리서처v2");
  });

  it("agent 목록 조회", async () => {
    await request("POST", "/register", {
      agentId: "agent-b",
      displayName: "구현담당",
    });
    const res = await request("GET", "/agents");
    assert.equal(res.status, 200);
    const agents = (await res.json()) as Array<{ agentId: string }>;
    assert.ok(agents.length >= 2);
  });

  it("메시지 전송 및 수신", async () => {
    const sendRes = await request("POST", "/send", {
      from: "agent-a",
      to: "agent-b",
      text: "hello from a",
    });
    assert.equal(sendRes.status, 200);

    const pollRes = await request("GET", "/poll?agentId=agent-b");
    assert.equal(pollRes.status, 200);
    const data = (await pollRes.json()) as { messages: Array<{ from: string; text: string }> };
    assert.equal(data.messages.length, 1);
    assert.equal(data.messages[0].from, "agent-a");
    assert.equal(data.messages[0].text, "hello from a");
  });

  it("poll 후 메시지가 소비됨", async () => {
    const pollRes = await request("GET", "/poll?agentId=agent-b");
    const data = (await pollRes.json()) as { messages: unknown[] };
    assert.equal(data.messages.length, 0);
  });

  it("존재하지 않는 agentId로 send → 404", async () => {
    const res = await request("POST", "/send", {
      from: "agent-a",
      to: "nonexistent",
      text: "should fail",
    });
    assert.equal(res.status, 404);
  });

  it("메시지가 대상 agent에만 전달됨", async () => {
    await request("POST", "/register", {
      agentId: "agent-c",
      displayName: "테스터",
    });

    await request("POST", "/send", {
      from: "agent-a",
      to: "agent-c",
      text: "only for c",
    });

    // agent-b는 수신하지 않음
    const pollB = await request("GET", "/poll?agentId=agent-b");
    const dataB = (await pollB.json()) as { messages: unknown[] };
    assert.equal(dataB.messages.length, 0);

    // agent-c만 수신
    const pollC = await request("GET", "/poll?agentId=agent-c");
    const dataC = (await pollC.json()) as { messages: Array<{ text: string }> };
    assert.equal(dataC.messages.length, 1);
    assert.equal(dataC.messages[0].text, "only for c");
  });
});
