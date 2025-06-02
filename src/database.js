import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class DatabaseManager {
  constructor() {
    this.supabase = supabase;
    this.initialized = false;
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      console.log('Attempting to connect to Supabase...');
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');
      
      // First, let's check what tables are available
      const { data: tableData, error: tableError } = await this.supabase
        .from('high_score')
        .select('count')
        .limit(1);
      
      if (tableError) {
        console.error('Error connecting to Supabase table:', tableError);
        console.error('Error details:', JSON.stringify(tableError, null, 2));
        return false;
      }
      
      console.log('Successfully connected to Supabase');
      console.log('Table data:', tableData);
      this.initialized = true;
      return true;
    } catch (err) {
      console.error('Failed to initialize database connection:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      return false;
    }
  }

  async saveHighScore(playerName, score, date = new Date().toISOString()) {
    // Wait for initialization if not already done
    if (!this.initialized) {
      const initResult = await this.initPromise;
      console.log('Initialization completed with result:', initResult);
      if (!initResult) {
        console.error('Cannot save high score because initialization failed');
        return false;
      }
    }

    try {
      console.log('Attempting to save high score:', { playerName, score, date });
      
      // Validate input data
      if (!playerName || typeof playerName !== 'string') {
        console.error('Invalid player name:', playerName);
        return false;
      }
      
      if (typeof score !== 'number' || isNaN(score)) {
        console.error('Invalid score:', score);
        return false;
      }
      
      // Log the exact data being sent to Supabase
      const payload = { player_name: playerName, score: score, date: date };
      console.log('Sending payload to Supabase:', JSON.stringify(payload, null, 2));
      
      const { data, error } = await this.supabase
        .from('high_score')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error saving high score to Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('High score saved successfully:', data);
      return true;
    } catch (err) {
      console.error('Failed to save high score:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      return false;
    }
  }

  async getTopHighScores(limit = 10) {
    // Wait for initialization if not already done
    if (!this.initialized) {
      await this.initPromise;
    }

    try {
      console.log(`Attempting to fetch top ${limit} high scores...`);
      
      const { data, error } = await this.supabase
        .from('high_score')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching high scores from Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('Successfully fetched high scores:', data);
      return data || [];
    } catch (err) {
      console.error('Failed to fetch high scores:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      return [];
    }
  }

  async getPlayerHighScores(playerName, limit = 5) {
    // Wait for initialization if not already done
    if (!this.initialized) {
      await this.initPromise;
    }

    try {
      console.log(`Attempting to fetch ${limit} high scores for player: ${playerName}`);
      
      const { data, error } = await this.supabase
        .from('high_score')
        .select('*')
        .eq('player_name', playerName)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching player high scores from Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return [];
      }

      console.log('Successfully fetched player high scores:', data);
      return data || [];
    } catch (err) {
      console.error('Failed to fetch player high scores:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      return [];
    }
  }
}
