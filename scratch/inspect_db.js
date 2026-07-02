const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://stfjghudefipojpcdxtn.supabase.co'
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZmpnaHVkZWZpcG9qcGNkeHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTIzOTYsImV4cCI6MjA4NTg4ODM5Nn0.7lWo_gUi3zA5GF7wsGPdlStWwGLWI66QI4nRf0WjG_A'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZmpnaHVkZWZpcG9qcGNkeHRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMxMjM5NiwiZXhwIjoyMDg1ODg4Mzk2fQ.Oc-jCmysX6Fn8gSy2CeNwH_APDI4YkXk-5aGUfWTvlc'

// Admin client to setup user
const adminSupabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// User client to simulate browser
const userSupabase = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const email = 'test.onboarding@smartchama.co.ke'
const password = 'TestOnboarding2026!'

async function run() {
  try {
    // 1. Create or get user in auth
    console.log('--- SETTING UP TEST USER ---')
    let userId;
    const { data: usersData } = await adminSupabase.auth.admin.listUsers()
    const existing = usersData.users.find(u => u.email === email)
    
    if (existing) {
      userId = existing.id
      console.log(`Test user already exists with ID: ${userId}`)
    } else {
      const { data: newUser, error: createErr } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
      if (createErr) throw createErr
      userId = newUser.user.id
      console.log(`Created test user with ID: ${userId}`)
    }

    // 2. Make sure profile exists
    await adminSupabase.from('profiles').upsert({
      id: userId,
      full_name: 'Test Onboarding User',
      email,
      phone_number: '+254700999999'
    })
    console.log('Profile created/upserted.')

    // 3. Sign in as test user using user client
    console.log('\n--- SIGNING IN USER CLIENT ---')
    const { data: sessionData, error: loginErr } = await userSupabase.auth.signInWithPassword({
      email,
      password
    })
    if (loginErr) throw loginErr
    console.log('Signed in successfully.')

    // 4. Try to insert chama
    console.log('\n--- INSERTING CHAMA VIA AUTH USER ---')
    const { data: chamaData, error: chamaErr } = await userSupabase
      .from('chamas_v2')
      .insert({
        name: 'Browser Sim Chama',
        description: 'Simulated from node script',
        contribution_amount: 1000,
        contribution_frequency: 'monthly',
        meeting_day: 1,
        status: 'active',
        created_by: userId
      })
      .select('id, name')
      
    if (chamaErr) {
      console.error('Chama insert failed:', chamaErr)
    } else {
      console.log('Chama insert succeeded:', chamaData)
      
      const chamaId = chamaData[0].id
      
      // 5. Try to insert membership
      console.log('\n--- INSERTING MEMBERSHIP VIA AUTH USER ---')
      const { data: memberData, error: memberErr } = await userSupabase
        .from('chama_memberships')
        .insert({
          profile_id: userId,
          chama_id: chamaId,
          role: 'chairlady',
          trust_score: 100,
          status: 'active'
        })
        .select('id')
        
      if (memberErr) {
        console.error('Membership insert failed:', memberErr)
      } else {
        console.log('Membership insert succeeded:', memberData)
      }
    }

  } catch (err) {
    console.error('Test run failed:', err)
  }
}

run()
