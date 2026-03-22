export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  rating: number;
  rating_count: number;
  banned: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  seller_id: string;
  transport_type: string;
  operator_name: string;
  from_location: string;
  to_location: string;
  journey_date: string;
  seat_number: string;
  original_price: number;
  asking_price: number;
  ticket_image: string | null;
  status: 'pending' | 'available' | 'sold' | 'expired';
  verified: boolean;
  created_at: string;
  seller?: {
    name: string;
    rating: number;
    rating_count: number;
  };
}

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  ticket_id: string;
  payment_method: string;
  transaction_reference: string;
  status: string;
  created_at: string;
  ticket?: Ticket;
  seller?: {
    name: string;
    phone: string;
  };
}

export interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender?: { name: string };
  receiver?: { name: string };
  ticket?: { transport_type: string, operator_name: string };
}

export interface Rating {
  id: string;
  transaction_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string;
  created_at: string;
}
