CREATE TABLE IF NOT EXISTS public.refresh_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  current_phase INT NOT NULL DEFAULT 1 CHECK (current_phase IN (1, 2, 3)),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  phase_1_completed BOOLEAN NOT NULL DEFAULT false,
  phase_2_completed BOOLEAN NOT NULL DEFAULT false,
  phase_3_completed BOOLEAN NOT NULL DEFAULT false,
  error_logs TEXT
);

-- Allow read access for authenticated users (or just admin, but anon can be blocked)
ALTER TABLE public.refresh_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all users"
ON public.refresh_cycles FOR SELECT
USING (true);

-- Only service role can insert/update (we do this in server actions)
