/** Channel 서버 실행에 필요한 설정 */
export interface ChannelConfig {
  /** 이 서버가 수신 대기할 포트 */
  port: number;
}

/** HTTP를 통해 전달되는 메시지 */
export interface BridgeMessage {
  /** 메시지 본문 */
  content: string;
  /** 발신자의 포트 (응답 시 사용) */
  senderPort: number;
}

/** reply tool의 입력 인자 (v1 포트 기반) */
export interface ReplyArgs {
  /** 응답을 보낼 대상 포트 */
  targetPort: number;
  /** 응답 메시지 */
  text: string;
}

// --- Central Broker (v2) ---

/** 브로커에 등록된 agent */
export interface Agent {
  agentId: string;
  displayName: string;
}

/** POST /register body */
export interface RegisterPayload {
  agentId: string;
  displayName: string;
}

/** POST /send body */
export interface SendPayload {
  from: string;
  to: string;
  text: string;
}

/** 브로커 메시지 큐에 저장되는 메시지 */
export interface QueuedMessage {
  from: string;
  fromDisplayName: string;
  text: string;
  timestamp: number;
}

/** GET /poll 응답 */
export interface PollResponse {
  messages: QueuedMessage[];
}

/** broker-channel MCP 설정 */
export interface BrokerChannelConfig {
  brokerUrl: string;
  agentId: string;
  displayName: string;
  pollIntervalMs: number;
}

/** broker-channel reply tool 인자 */
export interface BrokerReplyArgs {
  targetAgent: string;
  text: string;
}
