export type UserRole = "hosteller" | "dayscholar";

export type DeliveryStatus =
  | "pending"
  | "in_progress"
  | "buying"
  | "on_the_way"
  | "delivered";

export type UrgencyLevel = "low" | "medium" | "high";

export type MessageType =
  | "text"
  | "image"
  | "location"
  | "price_confirmation"
  | "system";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  trustScore: number;
  deliveries: number;
  rating: number;
  earnings: number;
}

export interface DeliveryRequest {
  id: string;
  itemName: string;
  quantity: number;
  estimatedPrice: number;
  urgency: UrgencyLevel;
  notes?: string;
  imageUrl?: string;
  status: DeliveryStatus;
  hostelBlock: string;
  createdBy: User;
  acceptedBy?: User;
  createdAt: string;
  reward: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: MessageType;
  content: string;
  imageUrl?: string;
  location?: { lat: number; lng: number };
  price?: number;
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  requestId: string;
  participants: string[];
  itemName: string;
  status: DeliveryStatus;
}
