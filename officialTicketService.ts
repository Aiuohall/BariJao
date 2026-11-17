import { getSqlite } from './database.ts';
import crypto from 'crypto';

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
  ladies_seats: string[];
  boarding_points: BoardingPoint[];
  dropping_points: BoardingPoint[];
  amenities: string[];
  rating: number;
  rating_count: number;
  cancellation_policy: string;
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

// Built-in Seed Trips across Bangladesh
const INITIAL_TRIPS: Omit<OfficialTrip, 'id' | 'available_seats'>[] = [
  // --- BUS: DHAKA -> COX'S BAZAR ---
  {
    transport_type: 'bus',
    operator_name: 'Green Line Paribahan',
    service_type: 'Scania Multi-Axle Super Executive AC',
    coach_number: 'GL-901',
    from_location: 'Dhaka',
    to_location: "Cox's Bazar",
    departure_time: '08:00 AM',
    arrival_time: '05:30 PM',
    duration: '9h 30m',
    fare: 2200,
    total_seats: 36,
    seat_layout: 'bus_2x1_business',
    booked_seats: ['A1', 'B2', 'C1', 'D3'],
    ladies_seats: ['A3', 'A4'],
    boarding_points: [
      { name: 'Rajarbagh Central Counter', time: '07:30 AM', address: 'Outer Circular Rd, Rajarbagh' },
      { name: 'Sayedabad Terminal', time: '08:00 AM', address: 'Green Line Counter, Sayedabad' },
      { name: 'Arambagh Counter', time: '08:15 AM', address: 'Arambagh Bus Stand' }
    ],
    dropping_points: [
      { name: 'Kolatoli Point Counter', time: '05:00 PM', address: 'Hotel Sea Palace Mor, Kolatoli' },
      { name: 'Dolphin Mor Terminal', time: '05:30 PM', address: 'Main Beach Road, Cox\'s Bazar' }
    ],
    amenities: ['High-speed WiFi', 'Mineral Water', 'Charging Port', 'AC', 'Soft Blanket', 'GPS Tracking'],
    rating: 4.9,
    rating_count: 320,
    cancellation_policy: 'Refundable up to 12 hours prior to departure.'
  },
  {
    transport_type: 'bus',
    operator_name: 'Hanif Enterprise',
    service_type: 'Hyundai Universe Express AC',
    coach_number: 'HN-442',
    from_location: 'Dhaka',
    to_location: "Cox's Bazar",
    departure_time: '10:30 PM',
    arrival_time: '07:00 AM',
    duration: '8h 30m',
    fare: 1600,
    total_seats: 40,
    seat_layout: 'bus_2x2',
    booked_seats: ['B1', 'B2', 'E3', 'E4'],
    ladies_seats: ['A1', 'A2'],
    boarding_points: [
      { name: 'Gabtoli Terminal', time: '09:45 PM', address: 'Gabtoli Bus Terminal Counter #4' },
      { name: 'Sayedabad Janapath', time: '10:30 PM', address: 'Sayedabad Overbridge' }
    ],
    dropping_points: [
      { name: 'Jhawtala Bus Stand', time: '06:45 AM', address: 'Main Rd, Jhawtala' },
      { name: 'Kolatoli Beach Mor', time: '07:00 AM', address: 'Kolatoli Hotel Zone' }
    ],
    amenities: ['Air Conditioned', 'Charging Port', 'Mineral Water', 'Reading Lamp'],
    rating: 4.7,
    rating_count: 285,
    cancellation_policy: 'Non-refundable within 6 hours of journey.'
  },
  {
    transport_type: 'bus',
    operator_name: 'Saintmartin Paribahan',
    service_type: 'Mercedes-Benz Royal Sleeper Coach',
    coach_number: 'SM-808',
    from_location: 'Dhaka',
    to_location: "Cox's Bazar",
    departure_time: '11:15 PM',
    arrival_time: '07:30 AM',
    duration: '8h 15m',
    fare: 2500,
    total_seats: 30,
    seat_layout: 'bus_sleeper',
    booked_seats: ['L1', 'L2', 'U3'],
    ladies_seats: ['L3', 'L4'],
    boarding_points: [
      { name: 'Kalyanpur Counter', time: '10:15 PM', address: 'Mirpur Road, Kalyanpur' },
      { name: 'Sayedabad Counter', time: '11:15 PM', address: 'Sayedabad Dhal' }
    ],
    dropping_points: [
      { name: 'Kolatoli Bypass', time: '07:15 AM', address: 'Bypass Road, Kolatoli' },
      { name: 'Laboni Point Beach', time: '07:30 AM', address: 'Laboni Beach Road' }
    ],
    amenities: ['Full Flat Sleeper Bed', 'Personal Screen', 'High-speed WiFi', 'Snacks Box', 'Blanket & Pillow', 'Charging Port'],
    rating: 4.95,
    rating_count: 198,
    cancellation_policy: 'Free cancellation up to 24 hours in advance.'
  },

  // --- BUS: DHAKA -> CHATTOGRAM ---
  {
    transport_type: 'bus',
    operator_name: 'Shohagh Paribahan',
    service_type: 'Scania Double Decker AC',
    coach_number: 'SH-102',
    from_location: 'Dhaka',
    to_location: 'Chattogram',
    departure_time: '07:15 AM',
    arrival_time: '12:45 PM',
    duration: '5h 30m',
    fare: 1400,
    total_seats: 40,
    seat_layout: 'bus_2x2',
    booked_seats: ['A1', 'C2', 'D1', 'D2'],
    ladies_seats: ['A3', 'A4'],
    boarding_points: [
      { name: 'Malibagh DIT Road', time: '06:45 AM', address: 'Shohagh Head Office, Malibagh' },
      { name: 'Sayedabad Terminal', time: '07:15 AM', address: 'Sayedabad Counter #1' }
    ],
    dropping_points: [
      { name: 'AK Khan Gate', time: '12:15 PM', address: 'AK Khan Mor, Pahartali' },
      { name: 'Dampara Counter', time: '12:45 PM', address: 'Dampara Bus Stand, GEC' }
    ],
    amenities: ['WiFi', 'Mineral Water', 'Charging Port', 'AC', 'Pillow'],
    rating: 4.8,
    rating_count: 410,
    cancellation_policy: 'Standard cancellation policy applies.'
  },
  {
    transport_type: 'bus',
    operator_name: 'Desh Travels',
    service_type: 'Hyundai Universe Executive AC',
    coach_number: 'DT-303',
    from_location: 'Dhaka',
    to_location: 'Chattogram',
    departure_time: '02:30 PM',
    arrival_time: '08:00 PM',
    duration: '5h 30m',
    fare: 1300,
    total_seats: 38,
    seat_layout: 'bus_2x2',
    booked_seats: ['A2', 'F1', 'F2'],
    ladies_seats: ['B3', 'B4'],
    boarding_points: [
      { name: 'Kalyanpur Counter', time: '01:45 PM', address: 'Kalyanpur Bus Stand' },
      { name: 'Sayedabad Counter', time: '02:30 PM', address: 'Sayedabad Bus Terminal' }
    ],
    dropping_points: [
      { name: 'Alankar Mor', time: '07:30 PM', address: 'Alankar Shopping Complex' },
      { name: 'Dampara Head Office', time: '08:00 PM', address: 'Dampara, Chittagong' }
    ],
    amenities: ['Air Conditioned', 'Charging Sockets', 'Mineral Water', 'GPS Tracking'],
    rating: 4.75,
    rating_count: 215,
    cancellation_policy: '50% refund before 6 hours.'
  },

  // --- BUS: DHAKA -> SYLHET ---
  {
    transport_type: 'bus',
    operator_name: 'London Express',
    service_type: 'MAN Executive Sleeper Coach AC',
    coach_number: 'LE-501',
    from_location: 'Dhaka',
    to_location: 'Sylhet',
    departure_time: '08:30 AM',
    arrival_time: '01:45 PM',
    duration: '5h 15m',
    fare: 1500,
    total_seats: 32,
    seat_layout: 'bus_sleeper',
    booked_seats: ['L1', 'L3', 'U1'],
    ladies_seats: ['L2', 'L4'],
    boarding_points: [
      { name: 'Abdullahpur Counter', time: '07:45 AM', address: 'Uttara Sector 9' },
      { name: 'Sayedabad Terminal', time: '08:30 AM', address: 'London Express Lounge' }
    ],
    dropping_points: [
      { name: 'Humayun Rashid Chattar', time: '01:15 PM', address: 'South Surma, Sylhet' },
      { name: 'Kadamtoli Bus Terminal', time: '01:45 PM', address: 'Kadamtoli Central Terminal' }
    ],
    amenities: ['Executive Lounge Access', 'Luxury Sleeper', 'WiFi', 'Snack Pack', 'USB-C Charging'],
    rating: 4.9,
    rating_count: 175,
    cancellation_policy: 'Full refund 12h before trip.'
  },
  {
    transport_type: 'bus',
    operator_name: 'Ena Transport',
    service_type: 'Hyundai Universe Express AC',
    coach_number: 'ENA-772',
    from_location: 'Dhaka',
    to_location: 'Sylhet',
    departure_time: '09:00 AM',
    arrival_time: '02:30 PM',
    duration: '5h 30m',
    fare: 1000,
    total_seats: 40,
    seat_layout: 'bus_2x2',
    booked_seats: ['C1', 'C2', 'H1'],
    ladies_seats: ['A1', 'A2'],
    boarding_points: [
      { name: 'Mohakhali Inter-district Terminal', time: '08:30 AM', address: 'Mohakhali Counter #12' },
      { name: 'Uttara Jasimuddin', time: '09:00 AM', address: 'Jasimuddin Mor, Uttara' }
    ],
    dropping_points: [
      { name: 'Subidbazar Counter', time: '02:00 PM', address: 'Subidbazar Point' },
      { name: 'Kadamtoli Main Counter', time: '02:30 PM', address: 'Kadamtoli, Sylhet' }
    ],
    amenities: ['AC', 'Mineral Water', 'Music System', 'Experienced Driver'],
    rating: 4.6,
    rating_count: 530,
    cancellation_policy: 'Standard Ena cancellation rules.'
  },

  // --- BUS: DHAKA -> RAJSHAHI ---
  {
    transport_type: 'bus',
    operator_name: 'Desh Travels',
    service_type: 'Hyundai Universe Multi-Axle AC',
    coach_number: 'DT-404',
    from_location: 'Dhaka',
    to_location: 'Rajshahi',
    departure_time: '07:30 AM',
    arrival_time: '01:00 PM',
    duration: '5h 30m',
    fare: 1200,
    total_seats: 38,
    seat_layout: 'bus_2x2',
    booked_seats: ['B1', 'C3'],
    ladies_seats: ['A3', 'A4'],
    boarding_points: [
      { name: 'Gabtoli Terminal', time: '07:00 AM', address: 'Gabtoli Counter #8' },
      { name: 'Kalyanpur Counter', time: '07:30 AM', address: 'Kalyanpur Main Road' }
    ],
    dropping_points: [
      { name: 'Vodra Mor Counter', time: '12:30 PM', address: 'Vodra, Rajshahi' },
      { name: 'Shiroil Bus Terminal', time: '01:00 PM', address: 'Shiroil Railway Gate' }
    ],
    amenities: ['Air Conditioned', 'WiFi', 'Charging Sockets', 'Mineral Water'],
    rating: 4.85,
    rating_count: 240,
    cancellation_policy: 'Refundable up to 10 hours before departure.'
  },

  // --- TRAIN: BANGLADESH RAILWAY TRIPS ---
  {
    transport_type: 'train',
    operator_name: 'Bangladesh Railway',
    service_type: 'Subarna Express (701) - Snigdha AC Chair',
    coach_number: 'Coach CHA & KHA',
    from_location: 'Dhaka',
    to_location: 'Chattogram',
    departure_time: '04:30 PM',
    arrival_time: '09:45 PM',
    duration: '5h 15m',
    fare: 750,
    total_seats: 50,
    seat_layout: 'train_snigdha',
    booked_seats: ['01', '02', '15', '16', '24'],
    ladies_seats: ['05', '06'],
    boarding_points: [
      { name: 'Kamalapur Railway Station', time: '04:00 PM', address: 'Platform 3, Kamalapur, Dhaka' },
      { name: 'Dhaka Airport Railway Station', time: '04:55 PM', address: 'Airport Platform 1' }
    ],
    dropping_points: [
      { name: 'Chattogram Old Railway Station', time: '09:45 PM', address: 'Station Road, Chittagong' }
    ],
    amenities: ['AC Coach', 'Pantry Car', 'Clean Restrooms', 'Charging Outlets', 'Non-Stop Express'],
    rating: 4.8,
    rating_count: 890,
    cancellation_policy: 'Standard BR refund policy via station counter.'
  },
  {
    transport_type: 'train',
    operator_name: 'Bangladesh Railway',
    service_type: 'Cox\'s Bazar Express (813) - AC Snigdha',
    coach_number: 'Coach GHA & UMA',
    from_location: 'Dhaka',
    to_location: "Cox's Bazar",
    departure_time: '10:30 PM',
    arrival_time: '06:40 AM',
    duration: '8h 10m',
    fare: 1325,
    total_seats: 60,
    seat_layout: 'train_snigdha',
    booked_seats: ['03', '04', '09', '10', '18', '29', '30'],
    ladies_seats: ['11', '12'],
    boarding_points: [
      { name: 'Kamalapur Railway Station', time: '10:00 PM', address: 'Platform 5, Kamalapur' },
      { name: 'Dhaka Airport Station', time: '10:55 PM', address: 'Airport Railway Station' }
    ],
    dropping_points: [
      { name: 'Cox\'s Bazar Iconic Railway Station', time: '06:40 AM', address: 'Chander Para, Cox\'s Bazar' }
    ],
    amenities: ['Brand New Korean Coaches', 'AC', 'Panoramic Windows', 'Pantry Meal', 'Fastest Rail Track'],
    rating: 4.95,
    rating_count: 1250,
    cancellation_policy: 'Cancellation permitted online up to 48h prior.'
  },
  {
    transport_type: 'train',
    operator_name: 'Bangladesh Railway',
    service_type: 'Parabat Express (709) - Shovon Chair',
    coach_number: 'Coach JA & JHA',
    from_location: 'Dhaka',
    to_location: 'Sylhet',
    departure_time: '06:20 AM',
    arrival_time: '01:00 PM',
    duration: '6h 40m',
    fare: 345,
    total_seats: 60,
    seat_layout: 'train_shovon',
    booked_seats: ['01', '08', '14'],
    ladies_seats: ['02', '03'],
    boarding_points: [
      { name: 'Kamalapur Station', time: '05:50 AM', address: 'Platform 2, Kamalapur' },
      { name: 'Dhaka Airport Station', time: '06:45 AM', address: 'Airport Station' }
    ],
    dropping_points: [
      { name: 'Sylhet Railway Station', time: '01:00 PM', address: 'Kadamtoli, Sylhet' }
    ],
    amenities: ['Cushioned Seats', 'Window View', 'Tea & Snacks Vendor', 'Scenic Haor Views'],
    rating: 4.6,
    rating_count: 670,
    cancellation_policy: 'Standard BR refund deductions apply.'
  },
  {
    transport_type: 'train',
    operator_name: 'Bangladesh Railway',
    service_type: 'Silk City Express (753) - Snigdha AC',
    coach_number: 'Coach KA',
    from_location: 'Dhaka',
    to_location: 'Rajshahi',
    departure_time: '02:40 PM',
    arrival_time: '08:35 PM',
    duration: '5h 55m',
    fare: 650,
    total_seats: 50,
    seat_layout: 'train_snigdha',
    booked_seats: ['07', '12', '19', '20'],
    ladies_seats: ['05', '06'],
    boarding_points: [
      { name: 'Kamalapur Station', time: '02:15 PM', address: 'Platform 4, Kamalapur' },
      { name: 'Dhaka Airport Station', time: '03:05 PM', address: 'Airport Platform 2' }
    ],
    dropping_points: [
      { name: 'Rajshahi Railway Station', time: '08:35 PM', address: 'Shiroil, Rajshahi' }
    ],
    amenities: ['AC Coach', 'Bangabandhu Bridge Crossing', 'Pantry Service', 'Spacious Legroom'],
    rating: 4.75,
    rating_count: 510,
    cancellation_policy: 'BR ticket rules.'
  },

  // --- LAUNCH: INLAND WATERWAYS (SADARGHAT) ---
  {
    transport_type: 'launch',
    operator_name: 'MV Manami',
    service_type: 'Deluxe AC Cabin with River Balcony',
    coach_number: 'Deck 3, Cabin Wing',
    from_location: 'Dhaka',
    to_location: 'Barishal',
    departure_time: '09:00 PM',
    arrival_time: '05:00 AM',
    duration: '8h 00m',
    fare: 2400,
    total_seats: 24,
    seat_layout: 'launch_cabin',
    booked_seats: ['CAB-101', 'CAB-104', 'CAB-202'],
    ladies_seats: ['CAB-102'],
    boarding_points: [
      { name: 'Sadarghat Launch Terminal Pontoon #4', time: '07:30 PM', address: 'Sadarghat River Port, Old Dhaka' }
    ],
    dropping_points: [
      { name: 'Barishal River Port Terminal Pontoon #1', time: '05:00 AM', address: 'Band Road, Barishal' }
    ],
    amenities: ['Double Bed Deluxe AC', 'Attached Washroom', 'Private River Balcony', 'LED TV', 'Free WiFi', 'On-board Fine Restaurant', 'Emergency Lifeboat'],
    rating: 4.95,
    rating_count: 640,
    cancellation_policy: 'Cancel up to 24h before journey for 85% refund.'
  },
  {
    transport_type: 'launch',
    operator_name: 'MV Parabat-12',
    service_type: 'Single AC Economy Cabin',
    coach_number: 'Deck 2',
    from_location: 'Dhaka',
    to_location: 'Barishal',
    departure_time: '08:30 PM',
    arrival_time: '04:30 AM',
    duration: '8h 00m',
    fare: 1200,
    total_seats: 30,
    seat_layout: 'launch_cabin',
    booked_seats: ['CAB-12', 'CAB-15'],
    ladies_seats: ['CAB-02'],
    boarding_points: [
      { name: 'Sadarghat Launch Terminal Pontoon #2', time: '07:00 PM', address: 'Sadarghat, Dhaka' }
    ],
    dropping_points: [
      { name: 'Barishal Launch Ghat', time: '04:30 AM', address: 'Barishal Port Area' }
    ],
    amenities: ['Single Bed AC Cabin', 'Charging Port', 'Common Modern Washrooms', 'Canteen Service'],
    rating: 4.7,
    rating_count: 420,
    cancellation_policy: 'Cancel up to 12h before departure.'
  },
  {
    transport_type: 'launch',
    operator_name: 'MV Sundarban-16',
    service_type: 'VIP Presidential Suite',
    coach_number: 'Upper Deck VIP Zone',
    from_location: 'Dhaka',
    to_location: 'Barishal',
    departure_time: '09:15 PM',
    arrival_time: '05:15 AM',
    duration: '8h 00m',
    fare: 5500,
    total_seats: 8,
    seat_layout: 'launch_cabin',
    booked_seats: ['VIP-1', 'VIP-3'],
    ladies_seats: [],
    boarding_points: [
      { name: 'Sadarghat VIP Pontoon', time: '08:00 PM', address: 'Sadarghat, Old Dhaka' }
    ],
    dropping_points: [
      { name: 'Barishal River Port VIP Jetty', time: '05:15 AM', address: 'Band Road, Barishal' }
    ],
    amenities: ['King Size Bed', 'Mini Fridge', 'Smart 4K TV', 'Private Veranda', 'Complimentary Breakfast', 'Butler Service'],
    rating: 4.98,
    rating_count: 180,
    cancellation_policy: 'Flexible reschedule up to 24h.'
  },

  // --- FLIGHT: DOMESTIC AIRLINES ---
  {
    transport_type: 'flight',
    operator_name: 'Biman Bangladesh Airlines',
    service_type: 'Boeing 737-800 Economy (BG-433)',
    coach_number: 'Flight BG-433',
    from_location: 'Dhaka',
    to_location: "Cox's Bazar",
    departure_time: '11:30 AM',
    arrival_time: '12:35 PM',
    duration: '1h 05m',
    fare: 4200,
    total_seats: 72,
    seat_layout: 'flight_3x3',
    booked_seats: ['12A', '12B', '14D', '15F'],
    ladies_seats: [],
    boarding_points: [
      { name: 'Hazrat Shahjalal International Airport (DAC)', time: '10:00 AM', address: 'Domestic Terminal 2, Kurmitola, Dhaka' }
    ],
    dropping_points: [
      { name: 'Cox\'s Bazar International Airport (CXB)', time: '12:35 PM', address: 'Airport Road, Cox\'s Bazar' }
    ],
    amenities: ['20 kg Check-in Baggage', '7 kg Hand Luggage', 'Complimentary In-flight Snacks', 'Beverage Service', 'Frequent Flyer Miles'],
    rating: 4.85,
    rating_count: 512,
    cancellation_policy: 'Standard airline cancellation fees apply.'
  },
  {
    transport_type: 'flight',
    operator_name: 'US-Bangla Airlines',
    service_type: 'ATR 72-600 Economy (BS-141)',
    coach_number: 'Flight BS-141',
    from_location: 'Dhaka',
    to_location: 'Chattogram',
    departure_time: '09:00 AM',
    arrival_time: '09:50 AM',
    duration: '50m',
    fare: 3800,
    total_seats: 68,
    seat_layout: 'flight_3x3',
    booked_seats: ['03A', '03B', '08C', '08D'],
    ladies_seats: [],
    boarding_points: [
      { name: 'Hazrat Shahjalal Domestic Terminal', time: '07:45 AM', address: 'Terminal 2, Dhaka' }
    ],
    dropping_points: [
      { name: 'Shah Amanat International Airport (CGP)', time: '09:50 AM', address: 'Patenga, Chattogram' }
    ],
    amenities: ['20 kg Check-in Baggage', '7 kg Cabin Baggage', 'On-time Guarantee', 'Snacks & Fruit Juice'],
    rating: 4.9,
    rating_count: 730,
    cancellation_policy: 'Free date change up to 4h before departure.'
  },
  {
    transport_type: 'flight',
    operator_name: 'Air Astra',
    service_type: 'ATR 72-600 Modern Fleet (2A-441)',
    coach_number: 'Flight 2A-441',
    from_location: 'Dhaka',
    to_location: 'Sylhet',
    departure_time: '03:15 PM',
    arrival_time: '04:05 PM',
    duration: '50m',
    fare: 3900,
    total_seats: 70,
    seat_layout: 'flight_3x3',
    booked_seats: ['05A', '05B', '11C'],
    ladies_seats: [],
    boarding_points: [
      { name: 'Hazrat Shahjalal International Airport', time: '02:00 PM', address: 'Domestic Terminal, Dhaka' }
    ],
    dropping_points: [
      { name: 'Osmani International Airport (ZYL)', time: '04:05 PM', address: 'Airport Road, Sylhet' }
    ],
    amenities: ['Leather Seats', '20 kg Baggage', 'Cold Refreshments', 'Modern Turboprop Quiet Cabin'],
    rating: 4.88,
    rating_count: 290,
    cancellation_policy: 'Refundable with standard fee.'
  }
];

// Helper to seed initial trips if table is empty
let isInitialized = false;

export const initOfficialTickets = () => {
  if (isInitialized) return;
  const db = getSqlite();
  if (!db) return;

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS official_trips (
        id TEXT PRIMARY KEY,
        transport_type TEXT NOT NULL,
        operator_name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        coach_number TEXT,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        duration TEXT NOT NULL,
        fare REAL NOT NULL,
        total_seats INTEGER NOT NULL DEFAULT 40,
        available_seats INTEGER NOT NULL DEFAULT 40,
        seat_layout TEXT NOT NULL DEFAULT 'bus_2x2',
        booked_seats TEXT DEFAULT '[]',
        ladies_seats TEXT DEFAULT '[]',
        boarding_points TEXT DEFAULT '[]',
        dropping_points TEXT DEFAULT '[]',
        amenities TEXT DEFAULT '[]',
        rating REAL DEFAULT 4.8,
        rating_count INTEGER DEFAULT 140,
        cancellation_policy TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS official_bookings (
        id TEXT PRIMARY KEY,
        pnr TEXT UNIQUE NOT NULL,
        user_id TEXT,
        trip_id TEXT NOT NULL,
        transport_type TEXT NOT NULL,
        operator_name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        coach_number TEXT,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        journey_date TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        boarding_point TEXT NOT NULL,
        dropping_point TEXT NOT NULL,
        seats TEXT NOT NULL,
        seat_count INTEGER NOT NULL DEFAULT 1,
        passenger_name TEXT NOT NULL,
        passenger_phone TEXT NOT NULL,
        passenger_email TEXT,
        passenger_gender TEXT DEFAULT 'male',
        fare_per_seat REAL NOT NULL,
        total_fare REAL NOT NULL,
        discount_amount REAL DEFAULT 0,
        service_charge REAL DEFAULT 0,
        net_payable REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'confirmed',
        transaction_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countRow = db.prepare('SELECT count(*) as count FROM official_trips').get() as { count: number };
    if (!countRow || countRow.count === 0) {
      console.log('Seeding initial Bangladeshi official trips into official_trips...');
      const insertStmt = db.prepare(`
        INSERT INTO official_trips (
          id, transport_type, operator_name, service_type, coach_number,
          from_location, to_location, departure_time, arrival_time, duration,
          fare, total_seats, available_seats, seat_layout, booked_seats,
          ladies_seats, boarding_points, dropping_points, amenities, rating,
          rating_count, cancellation_policy
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      for (const t of INITIAL_TRIPS) {
        const id = crypto.randomUUID();
        const available_seats = t.total_seats - t.booked_seats.length;
        insertStmt.run(
          id,
          t.transport_type,
          t.operator_name,
          t.service_type,
          t.coach_number || '',
          t.from_location,
          t.to_location,
          t.departure_time,
          t.arrival_time,
          t.duration,
          t.fare,
          t.total_seats,
          available_seats,
          t.seat_layout,
          JSON.stringify(t.booked_seats),
          JSON.stringify(t.ladies_seats),
          JSON.stringify(t.boarding_points),
          JSON.stringify(t.dropping_points),
          JSON.stringify(t.amenities),
          t.rating,
          t.rating_count,
          t.cancellation_policy
        );
      }
      console.log(`Successfully seeded ${INITIAL_TRIPS.length} official trips.`);
    }
    isInitialized = true;
  } catch (err) {
    console.error('Error initializing official tickets in SQLite:', err);
  }
};

// Search & Filter Trips
export const getOfficialTrips = (params: {
  transport_type?: string;
  from?: string;
  to?: string;
  date?: string;
}): OfficialTrip[] => {
  initOfficialTickets();
  const db = getSqlite();
  if (!db) return [];

  let query = 'SELECT * FROM official_trips WHERE 1=1';
  const queryParams: any[] = [];

  if (params.transport_type && params.transport_type !== 'all') {
    query += ' AND transport_type = ?';
    queryParams.push(params.transport_type.toLowerCase());
  }

  if (params.from && params.from.trim()) {
    query += ' AND LOWER(from_location) LIKE ?';
    queryParams.push(`%${params.from.trim().toLowerCase()}%`);
  }

  if (params.to && params.to.trim()) {
    query += ' AND LOWER(to_location) LIKE ?';
    queryParams.push(`%${params.to.trim().toLowerCase()}%`);
  }

  query += ' ORDER BY fare ASC';

  const rows = db.prepare(query).all(...queryParams) as any[];

  // If search yielded nothing and both from/to are specified, generate dynamic fallback trips
  if (rows.length === 0 && params.from && params.to) {
    return generateDynamicTrips(params.from, params.to, params.transport_type || 'bus');
  }

  return rows.map(formatTripRow);
};

// Generate dynamic trips for any BD route pair
function generateDynamicTrips(from: string, to: string, transport_type: string): OfficialTrip[] {
  const tType = (['bus', 'train', 'launch', 'flight'].includes(transport_type) ? transport_type : 'bus') as OfficialTrip['transport_type'];
  
  const fromCap = from.charAt(0).toUpperCase() + from.slice(1);
  const toCap = to.charAt(0).toUpperCase() + to.slice(1);

  const configs: Record<string, { operators: string[], classes: string[], fares: number[] }> = {
    bus: {
      operators: ['Hanif Enterprise', 'Green Line Paribahan', 'Shyamoli NR Travels', 'Shohagh Paribahan', 'Desh Travels'],
      classes: ['Hyundai Universe AC', 'Scania Multi-Axle Luxury', 'Volvo B9R AC', 'Executive Sleeper Coach', 'Hino 1J Non-AC'],
      fares: [800, 1400, 1200, 1800, 650]
    },
    train: {
      operators: ['Bangladesh Railway', 'Bangladesh Railway', 'Bangladesh Railway'],
      classes: ['Intercity Express - Snigdha AC', 'Intercity Express - Shovon Chair', 'Intercity - AC Berth'],
      fares: [650, 360, 1100]
    },
    launch: {
      operators: ['MV Manami', 'MV Parabat', 'MV Sundarban', 'MV Adventure'],
      classes: ['Double AC Deluxe Cabin', 'Single AC Cabin', 'VIP Suite', 'First Class Deck'],
      fares: [2200, 1100, 4800, 400]
    },
    flight: {
      operators: ['Biman Bangladesh Airlines', 'US-Bangla Airlines', 'Air Astra', 'Novoair'],
      classes: ['Boeing 737 Economy', 'ATR 72-600 Regular', 'ATR 72 Modern Cabin', 'Domestic SuperSaver'],
      fares: [3900, 4200, 3800, 4100]
    }
  };

  const cfg = configs[tType] || configs.bus;
  const times = [
    { dep: '07:00 AM', arr: '01:00 PM', dur: '6h 00m' },
    { dep: '10:30 AM', arr: '04:30 PM', dur: '6h 00m' },
    { dep: '03:00 PM', arr: '09:00 PM', dur: '6h 00m' },
    { dep: '11:00 PM', arr: '05:30 AM', dur: '6h 30m' }
  ];

  return cfg.operators.map((op, idx) => {
    const time = times[idx % times.length];
    const fare = cfg.fares[idx % cfg.fares.length];
    const sType = cfg.classes[idx % cfg.classes.length];

    return {
      id: `dyn_${tType}_${idx}_${Date.now()}`,
      transport_type: tType,
      operator_name: op,
      service_type: sType,
      coach_number: `${op.substring(0, 2).toUpperCase()}-${300 + idx}`,
      from_location: fromCap,
      to_location: toCap,
      departure_time: time.dep,
      arrival_time: time.arr,
      duration: time.dur,
      fare,
      total_seats: 40,
      available_seats: 28 - idx * 3,
      seat_layout: tType === 'train' ? 'train_snigdha' : tType === 'launch' ? 'launch_cabin' : tType === 'flight' ? 'flight_3x3' : 'bus_2x2',
      booked_seats: ['A1', 'A2', 'B3'],
      ladies_seats: ['A3', 'A4'],
      boarding_points: [
        { name: `${fromCap} Central Terminal`, time: time.dep, address: `Main Station, ${fromCap}` },
        { name: `${fromCap} Highway Counter`, time: time.dep, address: `Bypass, ${fromCap}` }
      ],
      dropping_points: [
        { name: `${toCap} Main Bus Stand`, time: time.arr, address: `Central Point, ${toCap}` },
        { name: `${toCap} City Center`, time: time.arr, address: `Market Mor, ${toCap}` }
      ],
      amenities: ['Air Conditioned', 'Charging Outlets', 'Mineral Water', 'GPS Tracking', 'WiFi'],
      rating: +(4.6 + (idx * 0.08)).toFixed(1),
      rating_count: 85 + idx * 40,
      cancellation_policy: 'Standard cancellation policy applies.'
    };
  });
}

function formatTripRow(row: any): OfficialTrip {
  return {
    ...row,
    booked_seats: safeJsonParse(row.booked_seats, []),
    ladies_seats: safeJsonParse(row.ladies_seats, []),
    boarding_points: safeJsonParse(row.boarding_points, []),
    dropping_points: safeJsonParse(row.dropping_points, []),
    amenities: safeJsonParse(row.amenities, [])
  };
}

function safeJsonParse(val: any, fallback: any) {
  if (typeof val !== 'string') return val || fallback;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Get Single Trip
export const getTripById = (id: string): OfficialTrip | null => {
  initOfficialTickets();
  const db = getSqlite();
  if (!db) return null;

  const row = db.prepare('SELECT * FROM official_trips WHERE id = ?').get(id) as any;
  if (!row) {
    // Check if it's dynamic
    if (id.startsWith('dyn_')) {
      const parts = id.split('_');
      const tType = parts[1] || 'bus';
      const trips = generateDynamicTrips('Dhaka', 'Destination', tType);
      return trips[0] || null;
    }
    return null;
  }

  return formatTripRow(row);
};

// Create Booking
export const createOfficialBooking = (data: {
  trip_id: string;
  user_id?: string | null;
  seats: string[];
  passenger_name: string;
  passenger_phone: string;
  passenger_email?: string;
  passenger_gender?: 'male' | 'female' | 'other';
  boarding_point: string;
  dropping_point: string;
  payment_method: string;
  promo_code?: string;
  journey_date?: string;
}): OfficialBooking => {
  initOfficialTickets();
  const db = getSqlite();
  if (!db) throw new Error('Database not accessible');

  const trip = getTripById(data.trip_id);
  if (!trip) throw new Error('Trip not found');

  // Verify seat availability
  const conflict = data.seats.some(s => trip.booked_seats.includes(s));
  if (conflict) {
    throw new Error('One or more selected seats have already been booked. Please select another seat.');
  }

  const seat_count = data.seats.length;
  if (seat_count === 0) throw new Error('Please select at least one seat.');

  const total_fare = seat_count * trip.fare;
  const service_charge = 50; // Standard BD convenience fee (৳50)

  // Promo code discounts
  let discount_amount = 0;
  if (data.promo_code) {
    const code = data.promo_code.toUpperCase().trim();
    if (code === 'EID2026') {
      discount_amount = Math.min(Math.round(total_fare * 0.15), 300); // 15% off up to ৳300
    } else if (code === 'BARIJAO50') {
      discount_amount = 50;
    } else if (code === 'SHOHOZ10') {
      discount_amount = Math.min(Math.round(total_fare * 0.10), 200);
    }
  }

  const net_payable = Math.max(total_fare + service_charge - discount_amount, 0);

  // Generate Unique PNR: e.g. BJ-BUS-82914
  const prefixMap: Record<string, string> = {
    bus: 'BJ-BUS',
    train: 'BJ-TRN',
    launch: 'BJ-LNC',
    flight: 'BJ-AIR'
  };
  const prefix = prefixMap[trip.transport_type] || 'BJ-ETK';
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const pnr = `${prefix}-${randomNum}`;
  const id = crypto.randomUUID();
  const txnId = `TXN-${data.payment_method.toUpperCase()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const now = new Date().toISOString();
  const journey_date = data.journey_date || new Date().toISOString().split('T')[0];

  const stmt = db.prepare(`
    INSERT INTO official_bookings (
      id, pnr, user_id, trip_id, transport_type, operator_name, service_type,
      coach_number, from_location, to_location, journey_date, departure_time,
      boarding_point, dropping_point, seats, seat_count, passenger_name,
      passenger_phone, passenger_email, passenger_gender, fare_per_seat,
      total_fare, discount_amount, service_charge, net_payable, payment_method,
      payment_status, transaction_id, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  stmt.run(
    id,
    pnr,
    data.user_id || null,
    trip.id,
    trip.transport_type,
    trip.operator_name,
    trip.service_type,
    trip.coach_number || '',
    trip.from_location,
    trip.to_location,
    journey_date,
    trip.departure_time,
    data.boarding_point,
    data.dropping_point,
    JSON.stringify(data.seats),
    seat_count,
    data.passenger_name,
    data.passenger_phone,
    data.passenger_email || '',
    data.passenger_gender || 'male',
    trip.fare,
    total_fare,
    discount_amount,
    service_charge,
    net_payable,
    data.payment_method,
    'confirmed',
    txnId,
    now
  );

  // Update trip's booked seats in SQLite
  try {
    const updatedBooked = [...trip.booked_seats, ...data.seats];
    const updatedAvailable = Math.max(trip.total_seats - updatedBooked.length, 0);
    db.prepare(`
      UPDATE official_trips 
      SET booked_seats = ?, available_seats = ?
      WHERE id = ?
    `).run(JSON.stringify(updatedBooked), updatedAvailable, trip.id);
  } catch (err) {
    console.error('Could not update booked seats for trip in database:', err);
  }

  return {
    id,
    pnr,
    user_id: data.user_id || null,
    trip_id: trip.id,
    transport_type: trip.transport_type,
    operator_name: trip.operator_name,
    service_type: trip.service_type,
    coach_number: trip.coach_number,
    from_location: trip.from_location,
    to_location: trip.to_location,
    journey_date,
    departure_time: trip.departure_time,
    boarding_point: data.boarding_point,
    dropping_point: data.dropping_point,
    seats: data.seats,
    seat_count,
    passenger_name: data.passenger_name,
    passenger_phone: data.passenger_phone,
    passenger_email: data.passenger_email,
    passenger_gender: data.passenger_gender || 'male',
    fare_per_seat: trip.fare,
    total_fare,
    discount_amount,
    service_charge,
    net_payable,
    payment_method: data.payment_method,
    payment_status: 'confirmed',
    transaction_id: txnId,
    created_at: now
  };
};

// Retrieve Booking by PNR or Phone
export const getBookingByPnrOrPhone = (query: string): OfficialBooking | null => {
  initOfficialTickets();
  const db = getSqlite();
  if (!db) return null;

  const clean = query.trim().toUpperCase();
  const row = db.prepare(`
    SELECT * FROM official_bookings 
    WHERE UPPER(pnr) = ? OR passenger_phone = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(clean, query.trim()) as any;

  if (!row) return null;

  return {
    ...row,
    seats: safeJsonParse(row.seats, [])
  };
};

// Get Bookings for a User
export const getUserBookings = (userId: string, phone?: string): OfficialBooking[] => {
  initOfficialTickets();
  const db = getSqlite();
  if (!db) return [];

  let rows: any[] = [];
  if (phone) {
    rows = db.prepare(`
      SELECT * FROM official_bookings 
      WHERE user_id = ? OR passenger_phone = ?
      ORDER BY created_at DESC
    `).all(userId, phone);
  } else {
    rows = db.prepare(`
      SELECT * FROM official_bookings 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);
  }

  return rows.map(r => ({
    ...r,
    seats: safeJsonParse(r.seats, [])
  }));
};
