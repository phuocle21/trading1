#!/usr/bin/env node

/**
 * Script to initialize Supabase tables
 * 
 * Cách sử dụng:
 * 1. npm install @supabase/supabase-js dotenv
 * 2. NODE_ENV=production NEXT_PUBLIC_SUPABASE_URL=your_url NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key node scripts/init-supabase.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local if exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  console.log('No .env.local file found, using environment variables');
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  try {
    console.log('🔄 Running database initialization...');

    // Read SQL schema from the file
    const sqlSchema = fs.readFileSync(
      path.join(__dirname, '../src/lib/supabase-tables.sql'), 
      'utf8'
    );

    // Execute SQL commands
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlSchema });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Fallback: Try to execute schema directly as a query
      console.log('🔄 Trying fallback method...');
      
      // Split by semicolons to run each command separately
      const commands = sqlSchema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0);
      
      for (const command of commands) {
        console.log(`🔄 Executing: ${command.substring(0, 60)}...`);
        const { error } = await supabase.from('_exec_sql').rpc('exec', { command });
        
        if (error) {
          console.error(`❌ Error with command: ${command}`);
          console.error(error);
        }
      }
    } else {
      console.log('✅ Database schema initialized successfully');
    }

    // Insert admin user if not exists
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'mrtinanpha@gmail.com')
      .maybeSingle();

    if (!adminExists) {
      console.log('🔄 Creating admin user...');
      
      const { error: adminError } = await supabase
        .from('users')
        .insert({
          id: 'admin-uid',
          email: 'mrtinanpha@gmail.com',
          password: 'VGluQDEyMw==', // Base64 của "Tin@123"
          is_admin: true,
          is_approved: true,
          created_at: Date.now(),
          last_login: Date.now()
        });

      if (adminError) {
        console.error('❌ Error creating admin user:', adminError);
      } else {
        console.log('✅ Admin user created successfully');
      }
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

main().catch(console.error);