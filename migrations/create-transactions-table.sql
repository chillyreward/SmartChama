-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    chama_id UUID REFERENCES public.chamas(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'loan', 'repayment', 'penalty', 'dividend'
    amount DECIMAL(10, 2) NOT NULL,
    phone_number VARCHAR(15),
    mpesa_receipt_number VARCHAR(50) UNIQUE,
    merchant_request_id VARCHAR(100),
    checkout_request_id VARCHAR(100),
    transaction_date TIMESTAMP,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_chama_id ON public.transactions(chama_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: System can insert transactions (for callbacks)
CREATE POLICY "System can insert transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Chama admins can view all chama transactions
CREATE POLICY "Admins can view chama transactions"
    ON public.transactions
    FOR SELECT
    USING (
        chama_id IN (
            SELECT chama_id 
            FROM public.chama_admins 
            WHERE admin_user_id = auth.uid()
        )
    );

COMMENT ON TABLE public.transactions IS 'Stores all financial transactions including M-Pesa deposits, loans, and repayments';
