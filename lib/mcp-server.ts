import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import {
  registerAgent,
  getAgents,
  sendMessage,
  getMasters,
  addMaster,
  removeMaster,
} from "./broker-state.js";

/**
 * Creates an MCP server instance for a specific agent.
 * Each agent session gets its own MCP server with tools bound to their agentId.
 */
export function createAgentMcpServer(agentId: string, displayName: string): McpServer {
  // Auto-register agent on connection
  registerAgent(agentId, displayName);

  const instructions = [
    `Messages from other agents arrive as <channel source="agent-rtc" from="agentId" from_name="displayName">.`,
    `Use the reply tool to respond. Pass the from value as targetAgent.`,
    `Use the list_agents tool to see who is online.`,
    `Your identity: agentId="${agentId}", displayName="${displayName}".`,
  ].join(" ");

  const server = new McpServer(
    { name: "agent-rtc", version: "0.2.0" },
    { instructions }
  );

  server.registerTool("reply", {
    description: "Send a message to another agent via the broker",
    inputSchema: z.object({
      targetAgent: z.string().describe("The agentId of the target agent"),
      text: z.string().describe("The message to send"),
    }),
  }, async ({ targetAgent, text }) => {
    const ok = sendMessage(agentId, targetAgent, text);
    if (!ok) {
      return { content: [{ type: "text" as const, text: `agent not found: ${targetAgent}` }] };
    }
    return { content: [{ type: "text" as const, text: "sent" }] };
  });

  server.registerTool("list_agents", {
    description: "List all registered agents on the broker",
    inputSchema: z.object({}),
  }, async () => {
    const agents = getAgents();
    return { content: [{ type: "text" as const, text: JSON.stringify(agents) }] };
  });

  server.registerTool("add_master", {
    description: "Add an agent to the global master pool. Masters receive permission relay requests from all agents.",
    inputSchema: z.object({
      masterAgentId: z.string().describe("The agentId to add as a global master"),
    }),
  }, async ({ masterAgentId }) => {
    addMaster(masterAgentId);
    return { content: [{ type: "text" as const, text: `master added: ${masterAgentId}` }] };
  });

  server.registerTool("remove_master", {
    description: "Remove an agent from the global master pool",
    inputSchema: z.object({
      masterAgentId: z.string().describe("The agentId to remove from the master pool"),
    }),
  }, async ({ masterAgentId }) => {
    removeMaster(masterAgentId);
    return { content: [{ type: "text" as const, text: `master removed: ${masterAgentId}` }] };
  });

  server.registerTool("list_masters", {
    description: "List all global master agents",
    inputSchema: z.object({}),
  }, async () => {
    const masters = getMasters();
    return { content: [{ type: "text" as const, text: JSON.stringify(masters) }] };
  });

  return server;
}
