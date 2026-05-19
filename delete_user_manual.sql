-- Script para deletar usuário manualmente pelo email
-- Substitua 'EMAIL_AQUI' pelo email real

DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'EMAIL_AQUI';  -- <<< SUBSTITUA AQUI
BEGIN
    -- Buscar o ID do usuário
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'Usuário com email % não encontrado no auth', v_email;
        RETURN;
    END IF;
    
    RAISE NOTICE 'Usuário encontrado: %', v_user_id;
    
    -- Deletar dados relacionados
    DELETE FROM service_completions WHERE expert_id = v_user_id OR client_id = v_user_id;
    DELETE FROM messages WHERE sender_id = v_user_id;
    DELETE FROM reviews WHERE expert_id = v_user_id OR client_id = v_user_id;
    DELETE FROM leads WHERE expert_id = v_user_id OR client_id = v_user_id;
    DELETE FROM appointments WHERE expert_id = v_user_id OR client_id = v_user_id OR cancelled_by = v_user_id;
    DELETE FROM audit_logs WHERE user_id = v_user_id;
    DELETE FROM commission_rates WHERE expert_id = v_user_id;
    DELETE FROM content_pages WHERE updated_by = v_user_id;
    DELETE FROM email_logs WHERE recipient_user_id = v_user_id;
    DELETE FROM notifications WHERE user_id = v_user_id;
    DELETE FROM support_tickets WHERE user_id = v_user_id OR assigned_to = v_user_id OR sender_id = v_user_id;
    
    -- Deletar perfil
    DELETE FROM profiles WHERE id = v_user_id;
    
    -- Deletar usuário do auth
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuário % deletado com sucesso!', v_email;
END $$;
