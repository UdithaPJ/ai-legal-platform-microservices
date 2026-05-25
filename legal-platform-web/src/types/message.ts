export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  clientId: string;
  lawyerId: string;
  appointmentId: number;
  documentId?: string;
  enabled: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface ChatMessageRequest {
  conversationId: string;
  content: string;
}
