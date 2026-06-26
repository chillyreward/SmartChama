export const responses: {
  triggers: string[]
  answer: string
}[] = [

  // GREETINGS
  {
    triggers: ['hi', 'hello', 'hey', 'hujambo', 'habari'],
    answer: 'Hello! Welcome to SmartChama. I can help you with contributions, loans, trust scores, invites, and more. What would you like to know?'
  },
  {
    triggers: ['good morning', 'good afternoon', 'good evening'],
    answer: 'Hello! How can I help you with SmartChama today?'
  },
  {
    triggers: ['thanks', 'thank you', 'asante'],
    answer: 'You are welcome! Is there anything else I can help you with?'
  },
  {
    triggers: ['bye', 'goodbye', 'kwaheri'],
    answer: 'Goodbye! Come back anytime if you have questions.'
  },
  
  // WHAT IS SMARTCHAMA
  {
    triggers: ['what is smartchama', 'what does smartchama do', 'tell me about smartchama', 'about smartchama'],
    answer: 'SmartChama is a digital platform for savings groups in Kenya. It helps chamas track contributions, manage loans, and build verified financial records. Your group manages its own money through M-Pesa, and SmartChama keeps the records clear and honest for everyone.'
  },
  {
    triggers: ['is smartchama a bank', 'do you hold money', 'is my money safe with you'],
    answer: 'SmartChama is not a bank. We do not hold your money. When you contribute, the money goes directly to your group admin\'s M-Pesa Till or Paybill number. SmartChama only tracks and records the transactions. Your admin is responsible for the group funds.'
  },
  {
    triggers: ['how much does it cost', 'pricing', 'free', 'subscription', 'how to pay'],
    answer: 'SmartChama has a free plan for groups of up to 20 members. The Growth plan costs KSh 999 per month and supports up to 100 members with advanced features. Enterprise pricing is available for larger organisations. Only the group admin pays the subscription, not individual members.'
  },
  
  // CONTRIBUTIONS
  {
    triggers: ['how to contribute', 'how to pay', 'make payment', 'how do i send money', 'contribute'],
    answer: 'To make a contribution: 1) Go to your dashboard and click "New Contribution". 2) Your phone number and the contribution amount will be pre-filled. 3) Click "Send M-Pesa Request". 4) You will receive an M-Pesa prompt on your phone. 5) Enter your M-Pesa PIN to complete the payment. The money goes to your admin\'s Till/Paybill number, and SmartChama records it automatically.'
  },
  {
    triggers: ['where does money go', 'who receives money', 'where does my payment go'],
    answer: 'Your contribution goes directly to your group admin\'s M-Pesa Till Number or Paybill. SmartChama does not receive or hold the money. You can see your admin\'s Till/Paybill number on the contribution screen before you pay, so you always know where your money is going.'
  },
  {
    triggers: ['contribution not showing', 'payment not recorded', 'i paid but it shows pending'],
    answer: 'If your payment shows as pending: 1) Wait 2-3 minutes as M-Pesa confirmations can take time. 2) Check that you received an M-Pesa success message on your phone. 3) If you got an M-Pesa confirmation but it still shows pending after 5 minutes, contact your admin with the M-Pesa receipt number. 4) If you never got an M-Pesa prompt, try making the contribution again from your dashboard.'
  },
  {
    triggers: ['monthly contribution', 'when to pay', 'due date', 'contribution deadline'],
    answer: 'Your group\'s contribution amount and due date are set by your admin. You can see your next due date on your dashboard. SmartChama will send you a reminder 3 days before the due date. Late payments may attract a penalty as set in your group rules.'
  },
  {
    triggers: ['contribution history', 'past contributions', 'my payments'],
    answer: 'You can see all your past contributions on the Contributions page in your dashboard. Each entry shows the date, amount, M-Pesa receipt number, and status. You can also export your contribution history as a PDF statement at any time.'
  },
  
  // LOANS
  {
    triggers: ['how to get loan', 'request loan', 'apply loan', 'how do loans work', 'loan request'],
    answer: 'To request a loan: 1) Go to the Loans page in your dashboard. 2) Click "Request Loan". 3) Enter the amount you need and the reason. 4) Submit the request. Your group admin will review and approve or decline it. You need a minimum trust score (set by your admin) to be eligible. Loans are paid from your group\'s pool and must be repaid with interest as agreed.'
  },
  {
    triggers: ['loan interest', 'interest rate', 'how much interest'],
    answer: 'Your group\'s loan interest rate is set by your admin. The typical rate is 10% per month, but this varies by group. You can see the interest rate on the loan request screen. The total amount you need to repay is calculated automatically before you submit your request.'
  },
  {
    triggers: ['loan repayment', 'how to repay', 'pay back loan', 'repay my loan'],
    answer: 'To repay a loan, go to the Loans page and click on your active loan. Click "Make Repayment". You will receive an M-Pesa prompt for the repayment amount. Every repayment is recorded and improves your trust score. You can make partial repayments or pay the full amount at once.'
  },
  {
    triggers: ['loan declined', 'loan rejected', 'why was my loan rejected'],
    answer: 'A loan can be declined if: 1) Your trust score is below the group minimum. 2) The group does not have enough funds. 3) Your admin decided against it. 4) You already have an unpaid loan. Contact your admin for the specific reason. Focus on contributing on time to improve your trust score and future eligibility.'
  },
  {
    triggers: ['maximum loan', 'how much can i borrow', 'loan limit'],
    answer: 'Your maximum loan amount is calculated as a multiple of your total savings. For example, if your group allows 3x loans and you have saved KSh 20,000, you can borrow up to KSh 60,000. Your admin sets the maximum multiplier in group settings.'
  },
  
  // TRUST SCORE
  {
    triggers: ['trust score', 'what is trust score', 'how is trust score calculated', 'trust score meaning'],
    answer: 'Your trust score is a number from 0 to 100 that shows how financially reliable you are in your group. It is calculated from: Contribution consistency (40%) - paying on time every month. Loan repayment (30%) - repaying loans fully and on time. Group tenure (20%) - how long you have been a member. Participation (10%) - your overall engagement. A higher score means bigger loans and, with your permission, can be shared with banks and SACCOs.'
  },
  {
    triggers: ['improve trust score', 'how to increase trust score', 'low trust score'],
    answer: 'To improve your trust score: 1) Pay your contribution on time every month. 2) Repay any loans on time and in full. 3) Stay in the group longer. 4) Do not miss any contribution cycles. Consistency is the most important factor. A missed or late payment reduces your score significantly.'
  },
  {
    triggers: ['trust score 0', 'why is my score zero', 'new member score'],
    answer: 'New members start at a trust score of 0. This is normal. Your score will build up as you make contributions on time. After 3 consistent monthly payments, you should see your score growing significantly.'
  },
  
  // INVITES AND MEMBERSHIP
  {
    triggers: ['how to join', 'join a group', 'invite code', 'how do i get invited'],
    answer: 'To join a SmartChama group, you need an invite from the group admin. The admin will send you an email with an invitation link. When you click the link, you will be taken to the signup page where your invite code is already filled in. Create your account and you will be automatically added to the group. You cannot join a group without an invite code.'
  },
  {
    triggers: ['how to invite member', 'add member', 'invite someone', 'admin invite'],
    answer: 'As an admin, go to the Members page or Settings page and click "Invite Member". Enter the member\'s email address and optionally their name. They will receive a branded email with an invitation link. You will also see a backup invite code in case their email does not arrive. The invite expires in 48 hours.'
  },
  {
    triggers: ['can i join multiple groups', 'multiple chamas', 'join two groups'],
    answer: 'Yes, you can be a member of multiple SmartChama groups. Each group is separate. When you log in, if you belong to more than one group, you will see a screen to choose which group to view. You can switch between groups at any time from the top navigation.'
  },
  
  // ACCOUNT AND SECURITY
  {
    triggers: ['forgot password', 'reset password', 'cannot login', 'login problem'],
    answer: 'If you have forgotten your password, go to the login page and click "Forgot password?". Enter your email address and you will receive a password reset link. Click the link in the email and set a new password. If you do not receive the email, check your spam folder or contact support@smartchama.co.ke'
  },
  {
    triggers: ['change password', 'update password', 'how to change my password'],
    answer: 'To change your password, go to Settings and click on the Security tab. Enter your current password and then your new password. Click Update Password. For your security, choose a strong password with at least 8 characters.'
  },
  {
    triggers: ['delete account', 'close account', 'remove my account'],
    answer: 'To delete your account, contact support@smartchama.co.ke. Note that your contribution and transaction records may be retained as part of the group\'s financial history even after your account is removed, since they affect other members\' records.'
  },
  
  // M-PESA
  {
    triggers: ['mpesa not working', 'stk push not coming', 'no mpesa prompt', 'mpesa failed'],
    answer: 'If you are not receiving the M-Pesa prompt: 1) Make sure your phone number in your profile matches your registered M-Pesa number. 2) Check that your M-Pesa is active and not suspended. 3) Ensure you have enough M-Pesa balance. 4) Wait 30 seconds and try again. 5) If the problem continues, contact your admin or support@smartchama.co.ke'
  },
  {
    triggers: ['what is paybill', 'what is till number', 'paybill number'],
    answer: 'Your group admin uses a Till Number or Paybill as the destination for your contributions. When you make a contribution, the M-Pesa prompt will automatically use your admin\'s registered Till/Paybill. The money goes directly to the admin\'s M-Pesa account. SmartChama records the transaction for everyone to see.'
  },
  
  // SMARTGROW
  {
    triggers: ['smartgrow', 'investments', 'how to invest', 'grow money'],
    answer: 'SmartGrow lets your group invest idle funds into regulated Kenyan investment products. These include Money Market Funds (9-11% returns), Government Treasury Bills (13-16%), and Fixed Deposits. All products are regulated by CMA Kenya or CBK. Investment decisions require a group vote where the majority wins. Go to the SmartGrow page to see available products and propose an investment.'
  },
  {
    triggers: ['smartgrow returns', 'investment returns', 'how much can i earn'],
    answer: 'Returns depend on the investment product. Money Market Funds typically return 9-11% per year. Government Treasury Bills return 13-16%. Returns are calculated proportionally based on each member\'s contribution to the total group savings. These are estimates and not guaranteed.'
  },
  
  // STATEMENTS AND EXPORTS
  {
    triggers: ['export statement', 'download pdf', 'pdf statement', 'download my records'],
    answer: 'You can export statements as PDF from multiple places: 1) My Savings page - export your full contribution history. 2) Transactions page - export filtered transactions. 3) Analytics page - export group reports. 4) Profile page - download your financial identity report. Look for the Export or Download button on each page.'
  },
  
  // ADMIN QUESTIONS
  {
    triggers: ['how to create group', 'create chama', 'start a group'],
    answer: 'To create a group: 1) Create a SmartChama account. 2) On the onboarding screen, choose "Create a new group". 3) Enter your group name, contribution amount, and frequency. 4) Set up your Till/Paybill number for receiving contributions. 5) You are now the admin. Invite members from the Members page or Settings.'
  },
  {
    triggers: ['admin withdrawal', 'how to withdraw', 'take money from group', 'group withdrawal'],
    answer: 'Admins can record a withdrawal in the Wallet page. However, every withdrawal requires a confirmation notice that is visible to all group members. Members can see all withdrawals in real time on the Transactions page. SmartChama cannot stop a withdrawal but makes it fully transparent so all members can see if money is being taken without consent.'
  },
  {
    triggers: ['how many admins', 'can there be two admins', 'admin roles'],
    answer: 'Each SmartChama group has one primary admin (the Chairperson) who created the group. The admin can assign secondary roles like Treasurer and Secretary to other members. However, only the primary admin pays the subscription and has full control. There is only one main admin per group.'
  },
  
  // NOTIFICATIONS
  {
    triggers: ['notifications', 'alerts', 'how do i get notified', 'reminders'],
    answer: 'SmartChama sends you notifications for: contribution reminders 3 days before due date, payment confirmations, loan approvals, new member joins, withdrawal alerts, and monthly reports. You can manage your notification preferences in Settings under the Notifications tab.'
  },
  
  // FRAUD AND SECURITY
  {
    triggers: ['is this safe', 'security', 'is my data safe', 'fraud'],
    answer: 'SmartChama uses bank-grade security: 256-bit encryption for all data, secure Supabase database with row-level security, blockchain-anchored transaction records that cannot be altered, and your M-Pesa PIN is never stored by us. All transactions are recorded and visible to group members for transparency.'
  },
  {
    triggers: ['fake account', 'scam', 'fake chama', 'suspicious activity'],
    answer: 'SmartChama has fraud protection built in: 1) Trust scores only build from verified M-Pesa receipts, not self-reported data. 2) Groups with suspicious patterns (one person, multiple chamas, same phone numbers) are flagged automatically. 3) All transactions are recorded and cannot be altered. If you suspect fraud, contact support@smartchama.co.ke immediately.'
  },
  
  // SUPPORT
  {
    triggers: ['contact support', 'help', 'support', 'i need help', 'customer care'],
    answer: 'You can reach SmartChama support at: Email: support@smartchama.co.ke | Visit the Support page from the sidebar (click Support above the logout button). We respond within 1 business day. For urgent M-Pesa issues, also check with your group admin.'
  },
  {
    triggers: ['report bug', 'something is not working', 'error', 'bug', 'problem with app'],
    answer: 'Sorry about that. Please email support@smartchama.co.ke with a description of the problem and what you were trying to do. If you can include a screenshot, that helps us fix it faster. You can also use the feedback form on the Support page.'
  },
  
  // WALLET
  {
    triggers: ['wallet', 'group wallet', 'what is wallet', 'wallet balance'],
    answer: 'The Wallet page shows your group\'s financial overview: total recorded contributions, funds currently out as loans, invested amounts in SmartGrow, and the emergency reserve. These numbers are calculated from verified M-Pesa transactions. The actual money is held in your admin\'s M-Pesa account.'
  },
  
  // DEFAULT
  {
    triggers: ['default'],
    answer: 'I am not sure about that one. Try asking about contributions, loans, trust scores, invites, M-Pesa, SmartGrow, or account settings. You can also reach us at support@smartchama.co.ke for anything I cannot answer.'
  }
]
