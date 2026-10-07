// Never hardcode keys here: this repo is public
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function queryRest(path) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  })
  return res.json()
}

async function run() {
  try {
    const email = 'marcus@gmail.com'
    const profiles = await queryRest(`profiles?email=eq.${email}`)
    console.log(`--- PROFILE FOR ${email} ---`)
    console.log(profiles)
  } catch(e) {
    console.error(e)
  }
}

run()
