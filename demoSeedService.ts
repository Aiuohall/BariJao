import { getSqlite } from './database.ts';
import bcrypt from 'bcryptjs';

export interface DemoUserDef {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
  rating: number;
  rating_count: number;
  is_verified: number;
  avatar_url: string;
  badge: string;
  description: string;
}

export const DEMO_PASSWORD = 'demopassword123';
export const DEMO_MASTER_OTP = '123456';
export const DEMO_PAYMENT_PIN = '12345';

export const DEMO_ACCOUNTS: DemoUserDef[] = [
  {
    id: 'd0000001-0000-0000-0000-000000000001',
    name: 'Tanvir Ahmed',
    email: 'tanvir.demo@barijao.com',
    phone: '01711000001',
    password: DEMO_PASSWORD,
    role: 'user',
    rating: 4.9,
    rating_count: 18,
    is_verified: 1,
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    badge: 'Frequent Commuter • Verified Seller',
    description: 'Lists extra seats on Dhaka - Cox\'s Bazar & Chattogram routes.'
  },
  {
    id: 'd0000002-0000-0000-0000-000000000002',
    name: 'Sadia Islam',
    email: 'sadia.demo@barijao.com',
    phone: '01811000002',
    password: DEMO_PASSWORD,
    role: 'user',
    rating: 5.0,
    rating_count: 14,
    is_verified: 1,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    badge: 'Top Rated Seller • 100% Genuine',
    description: 'DU student traveling to Sylhet & Barishal. Regular ticket seller.'
  },
  {
    id: 'd0000003-0000-0000-0000-000000000003',
    name: 'Rahim Chowdhury',
    email: 'rahim.demo@barijao.com',
    phone: '01911000003',
    password: DEMO_PASSWORD,
    role: 'user',
    rating: 4.8,
    rating_count: 22,
    is_verified: 1,
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
    badge: 'Corporate Traveler • Multi-Transit',
    description: 'Regularly resells spare Train and Flight tickets when schedule changes.'
  },
  {
    id: 'd0000004-0000-0000-0000-000000000004',
    name: 'Nusrat Jahan',
    email: 'nusrat.demo@barijao.com',
    phone: '01611000004',
    password: DEMO_PASSWORD,
    role: 'user',
    rating: 4.95,
    rating_count: 16,
    is_verified: 1,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    badge: 'Verified Reseller • Luxury Coach',
    description: 'Frequently books Sleeper & Business Class coaches to Khulna.'
  },
  {
    id: 'd0000005-0000-0000-0000-000000000005',
    name: 'Arif Hasan',
    email: 'arif.demo@barijao.com',
    phone: '01511000005',
    password: DEMO_PASSWORD,
    role: 'user',
    rating: 4.7,
    rating_count: 9,
    is_verified: 1,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    badge: 'Standard Buyer & Seller',
    description: 'Casual traveler on Dhaka - Bogura - Rajshahi routes.'
  }
];

const getFutureDateString = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export const initDemoData = (force: boolean = false) => {
  const db = getSqlite();
  if (!db) {
    console.warn('[DemoService] SQLite database not ready, skipping demo seed.');
    return;
  }

  try {
    // Check if demo users already exist
    const countRow = db.prepare(`SELECT count(*) as c FROM users WHERE email LIKE '%.demo@barijao.com'`).get() as any;
    const existingCount = countRow ? countRow.c : 0;

    if (existingCount >= DEMO_ACCOUNTS.length && !force) {
      // Demo accounts already populated
      return;
    }

    console.log('[DemoService] Seeding Developer Mode demo accounts and resale tickets...');

    // 1. Seed Demo Users
    const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 8);
    const insertUserStmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, rating, rating_count, is_verified, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const u of DEMO_ACCOUNTS) {
      insertUserStmt.run(
        u.id,
        u.name,
        u.email,
        u.phone,
        passwordHash,
        u.role,
        u.rating,
        u.rating_count,
        u.is_verified,
        u.avatar_url
      );
    }

    // 2. Seed Admin User if missing
    const adminPasswordHash = bcrypt.hashSync('adminpassword123', 8);
    db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, rating, rating_count, is_verified, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      '00000000-0000-0000-0000-000000000001',
      'System Admin',
      'admin@barijao.com',
      '01700000000',
      adminPasswordHash,
      'admin',
      5.0,
      100,
      1,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    );

    db.prepare(`
      INSERT OR IGNORE INTO admins (id, admin_identifier)
      VALUES (?, ?)
    `).run('00000000-0000-0000-0000-000000000001', 'ADMIN-2026');

    // 3. Seed Demo Resale Tickets
    const demoTickets = [
      {
        id: 't-demo-001',
        seller_id: DEMO_ACCOUNTS[0].id, // Tanvir Ahmed
        transport_type: 'bus',
        operator_name: 'Green Line Paribahan (Scania Multi-Axle)',
        from_location: 'Dhaka',
        to_location: "Cox's Bazar",
        journey_date: getFutureDateString(1),
        seat_number: 'A1, A2',
        original_price: 1600,
        asking_price: 1600,
        ticket_purchase_date: getFutureDateString(-2),
        ticket_image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600',
        status: 'available'
      },
      {
        id: 't-demo-002',
        seller_id: DEMO_ACCOUNTS[0].id, // Tanvir Ahmed
        transport_type: 'train',
        operator_name: 'Suborno Express (701 - Snigdha AC)',
        from_location: 'Dhaka',
        to_location: 'Chattogram',
        journey_date: getFutureDateString(2),
        seat_number: 'CHA-14, CHA-15',
        original_price: 850,
        asking_price: 850,
        ticket_purchase_date: getFutureDateString(-3),
        ticket_image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=600',
        status: 'available'
      },
      {
        id: 't-demo-003',
        seller_id: DEMO_ACCOUNTS[1].id, // Sadia Islam
        transport_type: 'bus',
        operator_name: 'Hanif Enterprise (Business Class 2x1)',
        from_location: 'Dhaka',
        to_location: 'Sylhet',
        journey_date: getFutureDateString(1),
        seat_number: 'B3',
        original_price: 950,
        asking_price: 900,
        ticket_purchase_date: getFutureDateString(-1),
        ticket_image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=600',
        status: 'available'
      },
      {
        id: 't-demo-004',
        seller_id: DEMO_ACCOUNTS[1].id, // Sadia Islam
        transport_type: 'launch',
        operator_name: 'MV Green Line 3 (VIP AC Double Cabin)',
        from_location: 'Dhaka',
        to_location: 'Barishal',
        journey_date: getFutureDateString(3),
        seat_number: 'VIP Cabin 104',
        original_price: 2400,
        asking_price: 2400,
        ticket_purchase_date: getFutureDateString(-4),
        ticket_image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=600',
        status: 'available'
      },
      {
        id: 't-demo-005',
        seller_id: DEMO_ACCOUNTS[2].id, // Rahim Chowdhury
        transport_type: 'train',
        operator_name: 'Silk City Express (754 - Shovon Chair)',
        from_location: 'Dhaka',
        to_location: 'Rajshahi',
        journey_date: getFutureDateString(2),
        seat_number: 'KHA-21',
        original_price: 420,
        asking_price: 420,
        ticket_purchase_date: getFutureDateString(-2),
        ticket_image: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&q=80&w=600',
        status: 'available'
      },
      {
        id: 't-demo-006',
        seller_id: DEMO_ACCOUNTS[2].id, // Rahim Chowdhury
        transport_type: 'flight',
        operator_name: 'Biman Bangladesh Airlines (BG-433 Economy)',
        from_location: 'Dhaka',
        to_location: "Cox's Bazar",
        journey_date: getFutureDateString(4),
        seat_number: '14A (Window)',
        original_price: 4500,
        asking_price: 4200,
        ticket_purchase_date: getFutureDateString(-5),
        ticket_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=600',
        status: 'available'
      },
      {
        id: 't-demo-007',
        seller_id: DEMO_ACCOUNTS[3].id, // Nusrat Jahan
        transport_type: 'bus',
        operator_name: 'Shohag Elite (Luxury Sleeper Class)',
        from_location: 'Dhaka',
        to_location: 'Khulna',
        journey_date: getFutureDateString(1),
        seat_number: 'Lower Deck L1',
        original_price: 1800,
        asking_price: 1750,
        ticket_purchase_date: getFutureDateString(-1),
        ticket_image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=600',
        status: 'available'
      }
    ];

    const insertTicketStmt = db.prepare(`
      INSERT OR REPLACE INTO tickets (id, seller_id, transport_type, operator_name, from_location, to_location, journey_date, seat_number, original_price, asking_price, ticket_purchase_date, ticket_image, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const t of demoTickets) {
      insertTicketStmt.run(
        t.id,
        t.seller_id,
        t.transport_type,
        t.operator_name,
        t.from_location,
        t.to_location,
        t.journey_date,
        t.seat_number,
        t.original_price,
        t.asking_price,
        t.ticket_purchase_date,
        t.ticket_image,
        t.status
      );
    }

    console.log(`[DemoService] Successfully seeded ${DEMO_ACCOUNTS.length} demo users and ${demoTickets.length} resale tickets.`);
  } catch (err) {
    console.error('[DemoService] Error seeding demo data:', err);
  }
};

/**
 * Cleanly removes all demo users, tickets, and associated demo records.
 * Leaves genuine production users completely untouched.
 */
export const purgeDemoData = () => {
  const db = getSqlite();
  if (!db) return { success: false, message: 'Database not accessible' };

  try {
    const demoUserIds = DEMO_ACCOUNTS.map(u => u.id);
    const placeholders = demoUserIds.map(() => '?').join(',');

    db.prepare(`DELETE FROM tickets WHERE seller_id IN (${placeholders}) OR id LIKE 't-demo-%'`).run(...demoUserIds);
    db.prepare(`DELETE FROM users WHERE email LIKE '%.demo@barijao.com' OR id IN (${placeholders})`).run(...demoUserIds);
    db.prepare(`DELETE FROM otp_codes WHERE email LIKE '%.demo@barijao.com'`).run();

    console.log('[DemoService] Purged all demo users and tickets successfully.');
    return { success: true, message: 'Demo data purged successfully.' };
  } catch (err: any) {
    console.error('[DemoService] Error purging demo data:', err);
    return { success: false, error: err.message };
  }
};
