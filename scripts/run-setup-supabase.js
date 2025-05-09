// File tạm thời để chạy script setupSupabase.ts
require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

console.log('Đang chuẩn bị kết nối lại với Supabase...');
console.log('URL Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Đã định nghĩa' : 'Chưa định nghĩa');
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Đã định nghĩa' : 'Chưa định nghĩa');

try {
  // Sử dụng ts-node để chạy file TypeScript
  const setupPath = path.join(__dirname, '../src/lib/setupSupabase.ts');
  
  console.log('Đang chạy script setupSupabase.ts...');
  console.log('Đường dẫn:', setupPath);
  
  // Tạo một file JavaScript tạm thời để import và chạy setupSupabase
  const tmpFile = path.join(__dirname, 'tmp-setup.js');
  const fs = require('fs');
  
  fs.writeFileSync(tmpFile, `
  // File tạm thời để chạy setup
  require('dotenv').config();
  
  (async () => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Thiếu biến môi trường Supabase! Vui lòng kiểm tra file .env');
        return;
      }
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Kiểm tra kết nối
      const { error } = await supabase.auth.getSession();
      if (error) {
        console.error('Lỗi kết nối Supabase:', error.message);
        return;
      }
      
      console.log('Kết nối thành công với Supabase!');
      
      // Tiến hành kiểm tra bảng users
      console.log('Đang kiểm tra bảng users...');
      const { data: usersTableData, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (usersError) {
        console.error('Lỗi khi kiểm tra bảng users:', usersError.message);
        console.log('Bạn cần tạo các bảng bằng SQL trước. Sử dụng SQL trong file supabase-tables.sql');
        return;
      }
      
      console.log('Bảng users tồn tại và có thể truy cập được.');
      
      // Kiểm tra user admin
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'mrtinanpha@gmail.com')
        .single();
      
      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Lỗi khi kiểm tra admin:', adminError.message);
        return;
      }
      
      // Tạo admin mặc định nếu chưa có
      if (!adminData) {
        console.log('Tạo user admin mặc định...');
        
        const { error: createAdminError } = await supabase
          .from('users')
          .insert({
            id: 'admin-uid',
            email: 'mrtinanpha@gmail.com',
            password: 'VGluQDEyMw==', // Base64 của "Tin@123"
            is_admin: true,
            is_approved: true,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          });
        
        if (createAdminError) {
          console.error('Lỗi khi tạo admin:', createAdminError.message);
          return;
        }
        
        console.log('Đã tạo user admin thành công.');
      } else {
        console.log('User admin đã tồn tại.');
      }
      
      // Kiểm tra bảng journals
      const { data: journalsData, error: journalsError } = await supabase
        .from('journals')
        .select('id')
        .limit(1);
      
      if (journalsError) {
        console.error('Lỗi khi kiểm tra bảng journals:', journalsError.message);
        console.log('Bạn cần tạo các bảng bằng SQL trước. Sử dụng SQL trong file supabase-tables.sql');
        return;
      }
      
      console.log('Bảng journals tồn tại và có thể truy cập được.');
      
      // Kiểm tra và tạo journal mặc định nếu chưa có
      if (journalsData && journalsData.length === 0) {
        console.log('Tạo journal mặc định...');
        
        const { error: createJournalError } = await supabase
          .from('journals')
          .insert({
            id: 'default-journal-id',
            name: 'My First Journal',
            description: 'Default trading journal',
            user_id: 'admin-uid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            trades: []
          });
        
        if (createJournalError) {
          console.error('Lỗi khi tạo journal mặc định:', createJournalError.message);
          return;
        }
        
        console.log('Đã tạo journal mặc định thành công.');
      } else {
        console.log('Journals đã tồn tại.');
      }
      
      console.log('Thiết lập Supabase hoàn tất thành công!');
    } catch (error) {
      console.error('Lỗi không mong muốn trong quá trình thiết lập:', error instanceof Error ? error.message : String(error));
    }
  })();
  `);
  
  console.log('Đang chạy script kiểm tra kết nối Supabase...');
  execSync('node ' + tmpFile, { stdio: 'inherit' });
  
  // Xóa file tạm thời sau khi chạy xong
  fs.unlinkSync(tmpFile);
  
  console.log('Đã hoàn tất việc kiểm tra và kết nối lại với Supabase!');
} catch (error) {
  console.error('Lỗi:', error);
}