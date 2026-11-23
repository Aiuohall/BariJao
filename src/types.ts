export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  rating: number;
  rating_count: number;
  banned: boolean;
  avatar_url?: string | null;
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
  ticket_id?: string | null;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender?: { name: string; avatar_url?: string | null; rating?: number };
  receiver?: { name: string; avatar_url?: string | null; rating?: number };
  ticket?: {
    id?: string;
    transport_type?: string;
    operator_name?: string;
    from_location?: string;
    to_location?: string;
    asking_price?: number;
  } | null;
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

export interface BoardingPoint {
  name: string;
  time: string;
  address?: string;
}

export interface OfficialTrip {
  id: string;
  transport_type: 'bus' | 'train' | 'launch' | 'flight';
  operator_name: string;
  service_type: string;
  coach_number?: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  fare: number;
  total_seats: number;
  available_seats: number;
  seat_layout: 'bus_2x2' | 'bus_2x1_business' | 'bus_sleeper' | 'train_shovon' | 'train_snigdha' | 'launch_cabin' | 'flight_3x3';
  booked_seats: string[];
  ladies_seats?: string[];
  boarding_points: BoardingPoint[];
  dropping_points: BoardingPoint[];
  amenities: string[];
  rating: number;
  rating_count: number;
  cancellation_policy?: string;
}

export interface OfficialBooking {
  id: string;
  pnr: string;
  user_id?: string | null;
  trip_id: string;
  transport_type: 'bus' | 'train' | 'launch' | 'flight';
  operator_name: string;
  service_type: string;
  coach_number?: string;
  from_location: string;
  to_location: string;
  journey_date: string;
  departure_time: string;
  boarding_point: string;
  dropping_point: string;
  seats: string[];
  seat_count: number;
  passenger_name: string;
  passenger_phone: string;
  passenger_email?: string;
  passenger_gender: 'male' | 'female' | 'other';
  fare_per_seat: number;
  total_fare: number;
  discount_amount: number;
  service_charge: number;
  net_payable: number;
  payment_method: string;
  payment_status: 'confirmed' | 'pending' | 'cancelled';
  transaction_id: string;
  created_at: string;
}

export interface PopularRoute {
  from: string;
  to: string;
  transport: string;
  minFare: number;
  duration: string;
  operatorsCount: number;
  image: string;
}
