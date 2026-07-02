const supabaseUrl = 'https://stfjghudefipojpcdxtn.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZmpnaHVkZWZpcG9qcGNkeHRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMxMjM5NiwiZXhwIjoyMDg1ODg4Mzk2fQ.Oc-jCmysX6Fn8gSy2CeNwH_APDI4YkXk-5aGUfWTvlc'

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
