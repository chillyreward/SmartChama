# Member Signup Troubleshooting Guide

## Error: "Failed to fetch" at supabase.auth.signUp

This error typically occurs when there's a network connectivity issue or Supabase configuration problem.

### Quick Fixes:

1. **Check Internet Connection**
   - Ensure you have an active internet connection
   - Try accessing https://stfjghudefipojpcdxtn.supabase.co in your browser
   - Should show a Supabase page (not an error)

2. **Verify Supabase Project Status**
   - Go to https://supabase.com/dashboard
   - Check if your project is active and running
   - Look for any service outages or maintenance

3. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for detailed error messages
   - Check Network tab for failed requests

4. **Clear Browser Cache**
   ```
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Clear cached images and files
   - Reload the page
   ```

5. **Restart Dev Server**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

6. **Check Supabase Email Settings**
   - Go to Supabase Dashboard > Authentication > Email Templates
   - Ensure email confirmation is configured
   - For development, you can disable email confirmation:
     - Go to Authentication > Settings
     - Disable "Enable email confirmations"

### Common Causes:

1. **Network Firewall/Proxy**
   - Corporate firewalls may block Supabase
   - Try on a different network or disable VPN

2. **Supabase Rate Limiting**
   - Too many signup attempts in short time
   - Wait a few minutes and try again

3. **Invalid Credentials**
   - Check if SUPABASE_URL and SUPABASE_ANON_KEY are correct
   - Verify in .env.local and src/lib/supabase.ts

4. **CORS Issues**
   - Add your localhost URL to Supabase allowed origins
   - Dashboard > Settings > API > Site URL
   - Add: http://localhost:3000

### Testing Steps:

1. **Test Supabase Connection:**
   ```javascript
   // Open browser console on any page
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(
     'https://stfjghudefipojpcdxtn.supabase.co',
     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0ZmpnaHVkZWZpcG9qcGNkeHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTIzOTYsImV4cCI6MjA4NTg4ODM5Nn0.7lWo_gUi3zA5GF7wsGPdlStWwGLWI66QI4nRf0WjG_A'
   );
   
   // Test connection
   supabase.from('chamas').select('count').then(console.log);
   ```

2. **Check Network Tab:**
   - Open DevTools > Network
   - Try to sign up
   - Look for failed requests to supabase.co
   - Check the error response

### Error Messages & Solutions:

| Error | Solution |
|-------|----------|
| "Failed to fetch" | Network/connectivity issue - check internet |
| "Invalid API key" | Wrong SUPABASE_ANON_KEY - verify credentials |
| "Email rate limit exceeded" | Wait 60 seconds before trying again |
| "User already registered" | Email/phone already exists - try login |
| "Invalid email format" | Check email generation logic |

### If Still Not Working:

1. **Check Supabase Logs:**
   - Dashboard > Logs > Auth Logs
   - Look for signup attempts and errors

2. **Verify Database Tables:**
   - Ensure `members` table exists
   - Check if RLS policies allow inserts

3. **Test with Different Browser:**
   - Try in incognito/private mode
   - Try a different browser

4. **Check Environment Variables:**
   ```bash
   # In your terminal
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

### Alternative: Manual Testing

If signup continues to fail, test the flow manually:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" manually
3. Create user with email format: `254712345678@smartchama.member`
4. Then add member record in Database > members table

This will help identify if the issue is with:
- Network connectivity
- Supabase configuration
- Code logic
- Database permissions

### Contact Support

If none of these work:
- Check Supabase status: https://status.supabase.com
- Supabase Discord: https://discord.supabase.com
- Check for known issues in Supabase GitHub
