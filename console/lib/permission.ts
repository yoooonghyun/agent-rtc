export interface PermissionRequest {
  agentId: string;
  agentName: string;
  tool: string;
  description: string;
  preview: string;
  requestId: string;
  timestamp: string;
}

/**
 * Parse permission request text into structured data.
 *
 * Expected format:
 * "Permission Request from agent-xxx (Session B)\nTool: Bash\nDescription: Run ls\nPreview: {...}\n\nReply: \"yes abcde\" or \"no abcde\""
 */
export function parsePermissionRequest(
  from: string,
  fromDisplayName: string,
  text: string,
  timestamp: string,
): PermissionRequest | null {
  const toolMatch = text.match(/^Tool:\s*(.+)$/m);
  const descMatch = text.match(/^Description:\s*(.+)$/m);
  const previewMatch = text.match(/^Preview:\s*(.+)$/m);
  const replyMatch = text.match(/Reply:\s*"yes\s+(\S+)"/);

  if (!replyMatch) return null;

  return {
    agentId: from,
    agentName: fromDisplayName || from,
    tool: toolMatch?.[1] ?? "Unknown",
    description: descMatch?.[1] ?? "",
    preview: previewMatch?.[1] ?? "",
    requestId: replyMatch[1],
    timestamp,
  };
}
