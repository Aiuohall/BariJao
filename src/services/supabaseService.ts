// Supabase Service v1.0.2
import { supabase } from '../supabaseClient';
import { User, Ticket, Message } from '../types';

export const supabaseService = {
  // Auth
  async register(userData: any) {
    // In a real Supabase app, we'd use supabase.auth.signUp
    // But to keep it compatible with the existing 'users' table logic:
    const { password, ...rest } = userData;
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        ...rest, 
        role: 'user', 
        rating: 5,
        password_hash: password
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async login(email: string, pass: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) throw new Error('Invalid credentials');
    if (user.password_hash !== pass) throw new Error('Invalid credentials'); // Simple check for prototype
    
    return { user, token: 'client-side-token' };
  },

  // Listings
  async getListings(filters: any) {
    let query = supabase
      .from('listings')
      .select('*, user:users(name, rating)')
      .eq('status', 'available');

    if (filters.from) query = query.ilike('from_location', `%${filters.from}%`);
    if (filters.to) query = query.ilike('to_location', `%${filters.to}%`);
    if (filters.type) query = query.eq('transport_type', filters.type);
    if (filters.date) query = query.eq('journey_date', filters.date);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getUserListings(userId: string) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createListing(listingData: any, userId: string) {
    const { data, error } = await supabase
      .from('listings')
      .insert([{ ...listingData, user_id: userId, status: 'pending' }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateListingStatus(id: string, status: 'pending' | 'available' | 'sold') {
    const { data, error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getListingById(id: string) {
    const { data, error } = await supabase
      .from('listings')
      .select('*, user:users(name, rating, phone)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Tickets
  async getTickets(filters: any) {
    let query = supabase
      .from('tickets')
      .select('*, seller:users(name, rating)')
      .eq('status', 'available');

    if (filters.from) query = query.ilike('from_location', `%${filters.from}%`);
    if (filters.to) query = query.ilike('to_location', `%${filters.to}%`);
    if (filters.type) query = query.eq('transport_type', filters.type);
    if (filters.date) query = query.eq('journey_date', filters.date);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTicket(ticketData: any, userId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .insert([{ ...ticketData, seller_id: userId, status: 'available' }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTicketById(id: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, seller:users(name, rating, phone)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
