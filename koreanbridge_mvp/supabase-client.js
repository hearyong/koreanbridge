// supabase-client.js

const supabaseUrl = 'https://npcrxldifamqgtafjhgw.supabase.co'; // 여기에 복사한 Project URL을 붙여넣으세요.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wY3J4bGRpZmFtcWd0YWZqaGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTYxNTYsImV4cCI6MjA3MDc3MjE1Nn0.uU1gsGPNyZgl4lHVebtKvwk4e52s2lj5wYPkkIq_b_M'; // 여기에 복사한 Anon Public Key를 붙여넣으세요.

// 바로 아래 'supabase' 변수 이름을 '_supabase'로 변경했습니다.
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);