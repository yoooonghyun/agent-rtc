import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

/** 지정 포트로 HTTP POST를 보내는 헬퍼 */
function postMessage(
  port: number,
  body: string,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port, method: "POST", path: "/", headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, body: data })
        );
      }
    );
    req.on("error", reject);
    req.end(body);
  });
}

/** 지정 포트에서 단일 요청을 수신하는 헬퍼 */
function listenOnce(
  port: number
): Promise<{ body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        res.writeHead(200);
        res.end("ok");
        server.close();
        resolve({ body: data, headers: req.headers });
      });
    });
    server.listen(port, "127.0.0.1");
  });
}

describe("bridge-channel HTTP server", () => {
  let channelProcess: ReturnType<typeof import("node:child_process").spawn>;

  // 테스트용 포트
  const CHANNEL_PORT = 18001;
  const REPLY_TARGET_PORT = 18099;

  before(async () => {
    // bridge-channel 서버를 자식 프로세스로 실행
    const { spawn } = await import("node:child_process");
    channelProcess = spawn(
      "node",
      ["dist/bridge-channel.js"],
      {
        env: { ...process.env, BRIDGE_PORT: String(CHANNEL_PORT) },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    // 서버가 뜰 때까지 대기
    await new Promise<void>((resolve) => {
      const check = () => {
        const req = http.request(
          { hostname: "127.0.0.1", port: CHANNEL_PORT, method: "GET", path: "/health" },
          (res) => {
            res.resume();
            resolve();
          }
        );
        req.on("error", () => setTimeout(check, 100));
        req.end();
      };
      check();
    });
  });

  after(() => {
    channelProcess?.kill();
  });

  it("POST 메시지를 수신하고 200을 반환한다", async () => {
    const res = await postMessage(CHANNEL_PORT, "hello from test");
    assert.equal(res.status, 200);
    assert.equal(res.body, "ok");
  });

  it("빈 body POST는 400을 반환한다", async () => {
    const res = await postMessage(CHANNEL_PORT, "");
    assert.equal(res.status, 400);
  });

  it("GET 요청(health 제외)은 405를 반환한다", async () => {
    const res = await new Promise<{ status: number }>((resolve, reject) => {
      const req = http.request(
        { hostname: "127.0.0.1", port: CHANNEL_PORT, method: "GET", path: "/" },
        (res) => {
          res.resume();
          resolve({ status: res.statusCode ?? 0 });
        }
      );
      req.on("error", reject);
      req.end();
    });
    assert.equal(res.status, 405);
  });

  it("reply 엔드포인트로 대상 포트에 메시지를 전달한다", async () => {
    // 대상 포트에서 수신 대기
    const receiver = listenOnce(REPLY_TARGET_PORT);

    // reply 엔드포인트 호출
    const res = await postMessage(
      CHANNEL_PORT,
      JSON.stringify({ targetPort: REPLY_TARGET_PORT, text: "reply from test" }),
      { "content-type": "application/json" }
    );

    // /reply 경로로 전송
    const resReply = await new Promise<{ status: number; body: string }>(
      (resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port: CHANNEL_PORT,
            method: "POST",
            path: "/reply",
            headers: { "content-type": "application/json" },
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () =>
              resolve({ status: res.statusCode ?? 0, body: data })
            );
          }
        );
        req.on("error", reject);
        req.end(
          JSON.stringify({ targetPort: REPLY_TARGET_PORT, text: "reply from test" })
        );
      }
    );

    assert.equal(resReply.status, 200);

    const received = await receiver;
    assert.ok(received.body.includes("reply from test"));
  });

  it("대상 서버가 꺼져 있으면 reply가 502를 반환한다", async () => {
    const res = await new Promise<{ status: number; body: string }>(
      (resolve, reject) => {
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port: CHANNEL_PORT,
            method: "POST",
            path: "/reply",
            headers: { "content-type": "application/json" },
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () =>
              resolve({ status: res.statusCode ?? 0, body: data })
            );
          }
        );
        req.on("error", reject);
        req.end(JSON.stringify({ targetPort: 19999, text: "should fail" }));
      }
    );
    assert.equal(res.status, 502);
  });
});
