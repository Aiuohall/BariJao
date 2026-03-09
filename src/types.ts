export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  rating: number;
  created_at: string;
}

export interface Ticket {
  id: string;
  seller_id: string;
  transport_type: 'bus' | 'train' | 'launch';
  operator_name: string;
  from_location: string;
  to_location: string;
  journey_date: string;
  seat_number: string;
  original_price: number;
  asking_price: number;
  ticket_purchase_date: string;
  ticket_image: string;
  status: 'available' | 'sold';
  created_at: string;
  seller?: {
    name: string;
    rating: number;
  };
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  ticket_id: string;
  message: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  ticket_id: string;
  payment_method: string;
  transaction_id: string;
  status: 'negotiating' | 'payment_sent' | 'ticket_delivered' | 'completed';
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  created_at: string;
}
