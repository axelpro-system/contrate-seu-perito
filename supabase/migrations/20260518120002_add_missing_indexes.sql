-- Add missing indexes for query performance

-- profiles: busca pública de peritos (profile_type + account_status + profile_visible)
CREATE INDEX IF NOT EXISTS idx_profiles_type_status ON profiles(profile_type, account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_visible ON profiles(profile_visible);

-- quotes: consultas por expert e requester
CREATE INDEX IF NOT EXISTS idx_quotes_expert_id ON quotes(expert_id);
CREATE INDEX IF NOT EXISTS idx_quotes_requester_id ON quotes(requester_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- messages: carregar mensagens de uma conversa
CREATE INDEX IF NOT EXISTS idx_messages_quote_id ON messages(quote_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- notifications: notificações do usuário + filtro de lidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- reviews: avaliações de um expert
CREATE INDEX IF NOT EXISTS idx_reviews_expert_id ON reviews(expert_id);

-- leads: leads de um expert ou cliente
CREATE INDEX IF NOT EXISTS idx_leads_expert_id ON leads(expert_id);
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);

-- service_completions: lookup por quote e participantes
CREATE INDEX IF NOT EXISTS idx_service_completions_quote_id ON service_completions(quote_id);
CREATE INDEX IF NOT EXISTS idx_service_completions_expert_id ON service_completions(expert_id);
CREATE INDEX IF NOT EXISTS idx_service_completions_client_id ON service_completions(client_id);

-- expert_services: serviços ativos de um expert
CREATE INDEX IF NOT EXISTS idx_expert_services_expert_id ON expert_services(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_services_active ON expert_services(is_active);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
