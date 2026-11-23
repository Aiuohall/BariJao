// API Service for BariJao
import { User, Ticket, Message, Transaction } from '../types';

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const apiService = {
  // Auth
  async register(userData: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email: string, pass: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async verifyOTP(email: string, code: string, type: string = 'login') {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed');
    return data;
  },

  async resendOTP(email: string) {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not resend the code');
    return data;
  },

  async adminLogin(adminId: string, pass: string) {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin login failed');
    return data;
  },

  // Profile
  async getProfile() {
    const res = await fetch(`${API_BASE}/profile`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
    return data;
  },

  async updateProfile(updates: any) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/profile/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password update failed');
    return data;
  },

  // Tickets
  async getTickets(filters: { from?: string; to?: string; date?: string }) {
    const params = new URLSearchParams(filters as any);
    const res = await fetch(`${API_BASE}/tickets?${params}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets');
    return data;
  },

  async getTicketById(id: string) {
    const res = await fetch(`${API_BASE}/tickets/${id}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch ticket');
    return data;
  },

  async createTicket(formData: FormData) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Listing failed');
    return data;
  },

  async updateTicket(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    return data;
  },

  async deleteTicket(id: string) {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    return data;
  },

  async buyTicket(id: string, paymentInfo: any) {
    const res = await fetch(`${API_BASE}/tickets/${id}/buy`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentInfo),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Purchase failed');
    return data;
  },

  // Dashboard
  async getUserDashboard() {
    const res = await fetch(`${API_BASE}/user/dashboard`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard');
    return data;
  },

  async getMyListings() {
    const res = await fetch(`${API_BASE}/dashboard/listings`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch listings');
    return data;
  },

  async getMyPurchases() {
    const res = await fetch(`${API_BASE}/dashboard/purchases`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch purchases');
    return data;
  },

  // Users & Directory
  async getUsers(q?: string) {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await fetch(`${API_BASE}/users${qs}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data;
  },

  async getUserById(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
    return data;
  },

  // Messages
  async getConversations() {
    const res = await fetch(`${API_BASE}/messages/conversations`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch messages');
    return data;
  },

  async getUserThread(userId: string) {
    const res = await fetch(`${API_BASE}/messages/thread/${encodeURIComponent(userId)}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user messages');
    return data;
  },

  async getMessages(ticketId: string, withUser?: string) {
    const qs = withUser ? `?with=${encodeURIComponent(withUser)}` : '';
    const res = await fetch(`${API_BASE}/messages/${ticketId}${qs}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch chat');
    return data;
  },

  async sendMessage(msgData: { receiver_id: string; message: string; ticket_id?: string | null }) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(msgData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Message failed');
    return data;
  },

  // Ratings
  async submitRating(ratingData: any) {
    const res = await fetch(`${API_BASE}/ratings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(ratingData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Rating failed');
    return data;
  },

  // AI
  async generateDescription(ticketDetails: any) {
    const res = await fetch(`${API_BASE}/ai/generate-description`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ticketDetails }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI generation failed');
    return data.description;
  },

  // Admin
  async adminGetUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    return await res.json();
  },
  async adminGetTickets() {
    const res = await fetch(`${API_BASE}/admin/tickets`, { headers: getHeaders() });
    return await res.json();
  },
  async adminGetTransactions() {
    const res = await fetch(`${API_BASE}/admin/transactions`, { headers: getHeaders() });
    return await res.json();
  },
  async adminVerifyTicket(id: string) {
    const res = await fetch(`${API_BASE}/admin/tickets/${id}/verify`, { method: 'POST', headers: getHeaders() });
    return await res.json();
  },
  async adminBanUser(id: string, banned: boolean) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/ban`, { 
      method: 'POST', 
      headers: getHeaders(),
      body: JSON.stringify({ banned })
    });
    return await res.json();
  },

  // Official E-Ticketing (Shohoz / BDtickets style)
  async getOfficialTrips(filters: { transport_type?: string; from?: string; to?: string; date?: string }) {
    const params = new URLSearchParams();
    if (filters.transport_type) params.append('transport_type', filters.transport_type);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.date) params.append('date', filters.date);

    const res = await fetch(`${API_BASE}/official/trips?${params.toString()}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch trips');
    return data;
  },

  async getOfficialTripById(id: string) {
    const res = await fetch(`${API_BASE}/official/trips/${id}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch trip');
    return data;
  },

  async createOfficialBooking(bookingData: any) {
    const res = await fetch(`${API_BASE}/official/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Booking failed');
    return data;
  },

  async getBookingByPnr(pnr: string) {
    const res = await fetch(`${API_BASE}/official/bookings/pnr/${encodeURIComponent(pnr.trim())}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No booking found');
    return data;
  },

  async getMyOfficialBookings(phone?: string) {
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    const res = await fetch(`${API_BASE}/official/my-bookings${qs}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
    return data;
  },

  async getPopularRoutes() {
    const res = await fetch(`${API_BASE}/official/popular-routes`);
    const data = await res.json();
    if (!res.ok) return [];
    return data;
  },

  // Developer Mode & Demo Helpers
  async getDemoAccounts() {
    const res = await fetch(`${API_BASE}/dev/demo-accounts`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch demo accounts');
    return data;
  },

  async quickDemoLogin(email: string) {
    const res = await fetch(`${API_BASE}/dev/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Quick demo login failed');
    return data;
  },

  async resetDemoData() {
    const res = await fetch(`${API_BASE}/dev/reset-demo`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return await res.json();
  },

  async purgeDemoData() {
    const res = await fetch(`${API_BASE}/dev/purge-demo`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return await res.json();
  }
};
