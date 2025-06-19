require('dotenv').config({ path: '../.env.local' });

console.log('🔍 Environment Variables Verification');
console.log('=====================================');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING');
console.log('NextAuth URL:', process.env.NEXTAUTH_URL ? 'SET' : 'MISSING');
console.log('NextAuth Secret:', process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING');

// Test API connectivity
const https = require('https');

// Test Supabase
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const options = {
        hostname: 'mpviqmngxjcvvakylseg.supabase.co',
        path: '/rest/v1/',
        method: 'GET',
        headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
    };
    
    const req = https.request(options, (res) => {
        console.log('✅ Supabase API Status:', res.statusCode);
    });
    
    req.on('error', (e) => {
        console.log('❌ Supabase API Error:', e.message);
    });
    
    req.end();
}

// Test OpenAI
if (process.env.OPENAI_API_KEY) {
    const options = {
        hostname: 'api.openai.com',
        path: '/v1/models',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    };
    
    const req = https.request(options, (res) => {
        console.log('✅ OpenAI API Status:', res.statusCode);
    });
    
    req.on('error', (e) => {
        console.log('❌ OpenAI API Error:', e.message);
    });
    
    req.end();
}