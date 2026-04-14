import { MessageModel } from 'src/chat21-core/models/message';

export type SenderKind = 'bot' | 'human' | 'system' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export interface SenderClassification {
  kind: SenderKind;
  confidence: Confidence;
  reasons: string[];
}

export interface ConversationBadgeState {
  /** Kind of the latest server message (including system). */
  latestServerMessageKind: SenderKind;
  /** Kind of the latest non-system server responder, used for Bot/Umano badge. */
  latestNonSystemResponderKind: 'bot' | 'human' | null;
  showBadge: boolean;
  badgeText: string;
}

export function classifyMessageSender(msg: MessageModel | null | undefined): SenderClassification {
  if (!msg) return { kind: 'unknown', confidence: 'low', reasons: ['msg=null'] };

  const sender = (msg as any).sender;
  const senderFullname = (msg as any).sender_fullname;
  const senderFullnameLower = (senderFullname || '').toString().toLowerCase();

  if (sender === 'system' || senderFullnameLower === 'system') {
    return { kind: 'system', confidence: 'high', reasons: ['sender=system'] };
  }

  const chatbotId = (msg as any)?.attributes?.flowAttributes?.chatbot_id;
  if (chatbotId) {
    return { kind: 'bot', confidence: 'high', reasons: ['flowAttributes.chatbot_id'] };
  }

  if (sender && String(sender).includes('bot_')) {
    return { kind: 'bot', confidence: 'medium', reasons: ['sender includes bot_'] };
  }

  if (senderFullnameLower.includes('bot')) {
    return { kind: 'bot', confidence: 'low', reasons: ['sender_fullname includes bot'] };
  }

  return { kind: 'human', confidence: 'low', reasons: ['fallback human'] };
}

export function isHumanHandoffSystemMessage(msg: MessageModel | null | undefined, clientSenderId?: string): boolean {
  if (!msg) return false;
  if ((msg as any).sender !== 'system') return false;

  const attrs: any = (msg as any).attributes || {};
  const key = attrs?.messagelabel?.key;
  const memberId = attrs?.messagelabel?.parameters?.member_id;

  if (attrs?.subtype !== 'info') return false;
  if (attrs?.updateconversation !== true) return false;
  if (key !== 'MEMBER_JOINED_GROUP') return false;
  if (!memberId || typeof memberId !== 'string') return false;

  // Exclude system/bot/self joins.
  if (memberId === 'system') return false;
  if (memberId.startsWith('bot_')) return false;
  if (clientSenderId && memberId === clientSenderId) return false;

  return true;
}

function getTimestamp(msg: MessageModel | null | undefined): number {
  const ts = msg && (msg as any).timestamp;
  const n = ts != null ? Number(ts) : 0;
  return Number.isFinite(n) ? n : 0;
}

function maxByTimestamp<T extends MessageModel>(items: T[]): T {
  return items.reduce((acc, cur) => (getTimestamp(cur) >= getTimestamp(acc) ? cur : acc), items[0]);
}

function isSystemMessage(msg: MessageModel | null | undefined): boolean {
  if (!msg) return false;
  const sender = (msg as any).sender;
  const senderFullname = (msg as any).sender_fullname;
  const senderFullnameLower = (senderFullname || '').toString().toLowerCase();
  return sender === 'system' || senderFullnameLower === 'system';
}

function isAgentHandoffCommandClientMessage(msg: MessageModel | null | undefined, clientSenderId?: string): boolean {
  if (!msg) return false;
  if (!clientSenderId) return false;
  if ((msg as any).sender !== clientSenderId) return false;
  const text = ((msg as any).text || '').toString().trim().toLowerCase();
  return text === '\\agent';
}

export function computeConversationBadgeState(messages: MessageModel[], clientSenderId?: string): ConversationBadgeState {
  const msgs = messages || [];
  const clientMsgs = clientSenderId ? msgs.filter(m => !!m && (m as any).sender === clientSenderId) : [];
  const serverMsgs = msgs.filter(m => !!m && (!clientSenderId || (m as any).sender !== clientSenderId));

  const latestClientMsg = clientMsgs.length > 0 ? maxByTimestamp(clientMsgs) : null;
  const latestServerMsg = serverMsgs.length > 0 ? maxByTimestamp(serverMsgs) : null;
  const latestServerMessageKind = classifyMessageSender(latestServerMsg).kind;

  let latestNonSystemResponderKind: 'bot' | 'human' | null = null;

  // Priority rule: explicit client command "\agent" requests human handoff.
  // As soon as the user sends it, we consider the conversation "human" for badge purposes,
  // even before any server-side system message (e.g. MEMBER_JOINED_GROUP) arrives.
  if (isAgentHandoffCommandClientMessage(latestClientMsg, clientSenderId)) {
    latestNonSystemResponderKind = 'human';
  } else
  // Priority rule: if the latest server message is a system handoff to a human, force "human".
  if (isHumanHandoffSystemMessage(latestServerMsg, clientSenderId)) {
    latestNonSystemResponderKind = 'human';
  } else {
    // Otherwise, use the latest non-system server message (by timestamp) as responder.
    const nonSystemServerMsgs = serverMsgs.filter(m => !isSystemMessage(m));
    const latestNonSystem = nonSystemServerMsgs.length > 0 ? maxByTimestamp(nonSystemServerMsgs) : null;
    const kind = classifyMessageSender(latestNonSystem).kind;
    if (kind === 'bot' || kind === 'human') {
      latestNonSystemResponderKind = kind;
    }
  }

  return {
    latestServerMessageKind,
    latestNonSystemResponderKind,
    showBadge: latestNonSystemResponderKind !== null,
    badgeText: latestNonSystemResponderKind === 'bot' ? 'Bot' : (latestNonSystemResponderKind === 'human' ? 'Umano' : ''),
  };
}

