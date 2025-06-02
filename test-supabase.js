import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your credentials
const supabaseUrl = 'https://rtzeehnqxcpunlogxvho.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0emVlaG5xeGNwdW5sb2d4dmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0Njk1NzQsImV4cCI6MjA2MzA0NTU3NH0.WaUVpxOplzu7pjehGlRm1xUu_9qbsubUH4hxZSMKkps';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function to insert a record
async function testInsert() {
  console.log('Starting Supabase test...');
  
  // Test data
  const testData = {
    player_name: 'Test Player',
    score: 1000,
    date: new Date().toISOString()
  };
  
  console.log('Attempting to insert test data:', testData);
  
  try {
    // First, let's check if we can read from the table
    console.log('Testing SELECT query...');
    const { data: selectData, error: selectError } = await supabase
      .from('high_score')
      .select('*')
      .limit(5);
      
    if (selectError) {
      console.error('SELECT Error:', selectError);
    } else {
      console.log('SELECT Success! Current records:', selectData);
    }
    
    // Now try to insert
    console.log('Testing INSERT query...');
    const { data: insertData, error: insertError } = await supabase
      .from('high_score')
      .insert([testData])
      .select();
      
    if (insertError) {
      console.error('INSERT Error:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('INSERT Success! Inserted data:', insertData);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testInsert();
