import supabase from './supabase';

/**
 * Script để thiết lập và khởi tạo dữ liệu trong Supabase
 * - Kiểm tra xem các bảng cần thiết đã tồn tại chưa
 * - Tạo người dùng admin mặc định nếu chưa có
 */
async function setupSupabaseDatabase() {
  console.log('Starting Supabase database setup...');

  try {
    // Kiểm tra bảng users
    const { data: usersTableData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.error('Error checking users table:', usersError.message);
      console.log('You may need to create the users table first. Use the SQL in supabase-tables.sql');
      return;
    }

    console.log('Users table exists and is accessible.');

    // Kiểm tra user admin
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mrtinanpha@gmail.com')
      .single();

    if (adminError && adminError.code !== 'PGRST116') { // PGRST116 là lỗi không tìm thấy
      console.error('Error checking for admin user:', adminError.message);
      return;
    }

    // Tạo admin mặc định nếu chưa có
    if (!adminData) {
      console.log('Creating default admin user...');
      
      const { error: createAdminError } = await supabase
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

      if (createAdminError) {
        console.error('Error creating admin user:', createAdminError.message);
        return;
      }

      console.log('Default admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }

    // Kiểm tra bảng journals
    const { data: journalsData, error: journalsError } = await supabase
      .from('journals')
      .select('id')
      .limit(1);

    if (journalsError) {
      console.error('Error checking journals table:', journalsError.message);
      console.log('You may need to create the journals table first. Use the SQL in supabase-tables.sql');
      return;
    }

    console.log('Journals table exists and is accessible.');

    // Kiểm tra và tạo journal mặc định nếu chưa có
    if (journalsData && journalsData.length === 0) {
      console.log('Creating default journal...');
      
      const { error: createJournalError } = await supabase
        .from('journals')
        .insert({
          id: crypto.randomUUID(),
          name: 'My First Journal',
          description: 'Default trading journal',
          user_id: 'admin-uid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          trades: []
        });

      if (createJournalError) {
        console.error('Error creating default journal:', createJournalError.message);
        return;
      }

      console.log('Default journal created successfully.');
    } else {
      console.log('Journals already exist.');
    }

    console.log('Supabase setup completed successfully!');
  } catch (error) {
    console.error('Unexpected error during setup:', error instanceof Error ? error.message : String(error));
  }
}

// Trong Edge Runtime, không có module.require, nên chỉ kiểm tra window
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development' && process.env.NEXT_RUNTIME !== 'edge') {
  // Chỉ tự động chạy trong môi trường Node.js, không phải Edge Runtime
  try {
    const nodeModule = require('module');
    if (nodeModule.runMain === nodeModule) {
      setupSupabaseDatabase().catch(console.error);
    }
  } catch (e) {
    // Bỏ qua lỗi nếu không phải môi trường Node.js
  }
}

export default setupSupabaseDatabase;