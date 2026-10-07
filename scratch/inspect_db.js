const { createClient } = require('@supabase/supabase-js')

// Never hardcode keys here: this repo is public
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
