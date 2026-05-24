-- Enable UUID generation if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: whatsapp_config
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    api_url TEXT NOT NULL,
    auth_token TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    webhook_verify_token TEXT,
    status TEXT DEFAULT 'NOT_CONNECTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users only" ON public.whatsapp_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write for authenticated users only" ON public.whatsapp_config
    FOR ALL USING (auth.role() = 'authenticated');

-- Table: whatsapp_messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    contact_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    direction TEXT DEFAULT 'outbound',
    message_body TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    appointment_status TEXT DEFAULT 'Confirmed',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users only" ON public.whatsapp_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write for authenticated users only" ON public.whatsapp_messages
    FOR ALL USING (auth.role() = 'authenticated');

-- Table: whatsapp_inbound
CREATE TABLE IF NOT EXISTS public.whatsapp_inbound (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    phone_number TEXT NOT NULL,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.whatsapp_inbound ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users only" ON public.whatsapp_inbound
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable write for authenticated users only" ON public.whatsapp_inbound
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data for dummy purposes
INSERT INTO public.whatsapp_messages (tenant_id, contact_name, phone_number, direction, message_body, status, appointment_status, timestamp)
VALUES 
  ('395b50b9-9504-4bda-bd38-7ce5b53e7aa0', 'John Doe', '+15551234567', 'outbound', 'Hi John, your appointment for tomorrow is confirmed!', 'read', 'Confirmed', NOW() - INTERVAL '1 hour'),
  ('395b50b9-9504-4bda-bd38-7ce5b53e7aa0', 'Jane Smith', '+15559876543', 'outbound', 'Hello Jane, please remember to bring your forms.', 'delivered', 'Confirmed', NOW() - INTERVAL '30 minutes'),
  ('395b50b9-9504-4bda-bd38-7ce5b53e7aa0', 'Alice Johnson', '+15554567890', 'outbound', 'Hi Alice, your appointment has been cancelled as requested.', 'sent', 'Cancelled', NOW() - INTERVAL '5 minutes');

INSERT INTO public.whatsapp_inbound (tenant_id, phone_number, message_body, is_read, timestamp)
VALUES 
  ('395b50b9-9504-4bda-bd38-7ce5b53e7aa0', '+15551234567', 'Thanks, see you tomorrow!', false, NOW() - INTERVAL '55 minutes'),
  ('395b50b9-9504-4bda-bd38-7ce5b53e7aa0', '+15554567890', 'Okay, thank you.', false, NOW() - INTERVAL '2 minutes');
