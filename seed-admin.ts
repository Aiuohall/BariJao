import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('barijao.db');

const adminEmail = 'admin@barijao.com';
const adminPassword = 'adminpassword123';
const adminIdentifier = 'ADMIN-2026';

const hashedPassword = bcrypt.hashSync(adminPassword, 10);

try {
  // Insert admin user
  const userStmt = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const adminId = '00000000-0000-0000-0000-000000000001';
  userStmt.run(adminId, 'Main Admin', adminEmail, '01700000000', hashedPassword, 'admin', 1);

  // Insert admin record
  const adminStmt = db.prepare(`
    INSERT OR IGNORE INTO admins (id, admin_identifier)
    VALUES (?, ?)
  `);
  adminStmt.run(adminId, adminIdentifier);

  console.log('Admin user seeded successfully');
} catch (error) {
  console.error('Error seeding admin user:', error);
} finally {
  db.close();
}
