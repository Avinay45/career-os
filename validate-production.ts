import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const firstEq = trimmed.indexOf('=');
      if (firstEq === -1) return;
      const key = trimmed.substring(0, firstEq).trim();
      let val = trimmed.substring(firstEq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      process.env[key] = val;
    });
  }
}

loadEnvLocal();

async function runValidation() {
  console.log('====================================================');
  console.log('CAREEROS PRODUCTION INTEGRATION VALIDATION RUNNER');
  console.log('====================================================\n');

  let failedCount = 0;

  function maskSecret(val: string | undefined): string {
    if (!val) return 'MISSING';
    if (val.length <= 8) return '********';
    return `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;
  }

  // PHASE 1: Environment Variable Check
  console.log('[PHASE 1] Validating Environment Configuration...');
  const keysToCheck = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENROUTER_API_KEY',
    'OPENROUTER_MODEL'
  ];

  keysToCheck.forEach(key => {
    const val = process.env[key];
    const isPlaceholder = !val || 
                        val.trim() === '' || 
                        val.includes('placeholder') || 
                        val.includes('your_') || 
                        val.includes('insert_');
                        
    if (isPlaceholder) {
      console.error(`  ✗ Key ${key} is missing or has placeholder value: ${maskSecret(val)}`);
      failedCount++;
    } else {
      console.log(`  ✓ Key ${key} is configured correctly: ${maskSecret(val)}`);
    }
  });

  if (failedCount > 0) {
    console.error('\n✗ validation failed in Phase 1. Add valid credentials to continue.');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const openrouterKey = process.env.OPENROUTER_API_KEY!;
  const openrouterModel = process.env.OPENROUTER_MODEL!;

  // PHASE 2: OpenRouter & Hermes 3 Connectivity (with 15s timeout)
  try {
    console.log('\n[PHASE 2] Validating OpenRouter / Hermes 3 Connectivity...');
    const startTime = performance.now();
    
    const testMessages = [
      { role: 'user' as const, content: 'Respond with exactly the single word "VERIFIED" and nothing else.' }
    ];
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://career-os.local',
        'X-Title': 'CareerOS',
      },
      body: JSON.stringify({
        model: openrouterModel,
        messages: testMessages,
        temperature: 0.1,
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    const latency = performance.now() - startTime;
    const cleanResponse = responseText.trim().replace(/['"]/g, '');
    
    if (cleanResponse.toUpperCase().includes('VERIFIED')) {
      console.log(`  ✓ Live OpenRouter query succeeded! Response: "${cleanResponse.substring(0, 30)}" (Latency: ${latency.toFixed(2)}ms)`);
    } else {
      throw new Error(`Unexpected live response content: "${responseText}"`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('  ✗ OpenRouter verification failed: Connection timed out after 15 seconds.');
    } else {
      console.error('  ✗ OpenRouter verification failed:', err.message || err);
    }
    failedCount++;
  }

  // PHASE 3: Supabase DB & Auth Connectivity
  let clientSupabase: any = null;
  try {
    console.log('\n[PHASE 3] Validating Supabase Live Database Connectivity...');
    clientSupabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await clientSupabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
      
    if (error && error.message.includes('schema cache')) {
      console.log('  ✓ Client Supabase DB connection successful (Table schema not yet initialized).');
    } else if (error) {
      throw error;
    } else {
      console.log('  ✓ Client Supabase DB connection successful.');
    }
  } catch (err: any) {
    console.error('  ✗ Client Supabase connection failed:', err.message || err);
    failedCount++;
  }

  // PHASE 4: Database Integrity & CRUD Actions (via service_role Admin client)
  try {
    console.log('\n[PHASE 4] Validating Admin Supabase & Table Integrity...');
    const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
    
    const tempSkillName = 'validation-temp-skill-' + Math.random().toString(36).substring(2, 9);
    
    const { error: insertError } = await adminSupabase
      .from('skills')
      .insert({
        name: tempSkillName,
        category: 'other'
      });
      
    if (insertError && insertError.message.includes('schema cache')) {
      console.log('  ⚠ Table public.skills not found. Database schema is empty. Needs migrations.');
      failedCount++;
    } else if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    } else {
      console.log('  ✓ Admin Supabase Insert operation succeeded.');
      
      const { error: deleteError } = await adminSupabase
        .from('skills')
        .delete()
        .eq('name', tempSkillName);
        
      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }
      console.log('  ✓ Admin Supabase Delete operation succeeded.');
    }
  } catch (err: any) {
    console.error('  ✗ Supabase DB Integrity or CRUD verification failed:', err.message || err);
    failedCount++;
  }

  console.log('\n====================================================');
  if (failedCount === 0) {
    console.log('✓ GO: ALL STAGES OF INTEGRATION VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error(`✗ NO-GO: ${failedCount} connectivity checks failed!`);
    process.exit(1);
  }
}

runValidation().catch(e => {
  console.error('Validation crashed:', e);
  process.exit(1);
});
