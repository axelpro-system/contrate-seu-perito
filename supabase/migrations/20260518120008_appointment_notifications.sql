-- Trigger function to auto-create notifications on appointment changes
CREATE OR REPLACE FUNCTION handle_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_expert_name text;
  v_client_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Client booked a new appointment → notify expert
    SELECT full_name INTO v_client_name FROM profiles WHERE id = NEW.client_id;
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.expert_id,
      'appointment_request',
      'Novo agendamento solicitado',
      COALESCE(v_client_name, 'Um cliente') || ' solicitou um agendamento para ' ||
        TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.start_time::text,
      jsonb_build_object('appointment_id', NEW.id)
    );

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN

    IF NEW.status = 'confirmed' THEN
      -- Expert confirmed → notify client
      SELECT full_name INTO v_expert_name FROM profiles WHERE id = NEW.expert_id;
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        NEW.client_id,
        'appointment_confirmed',
        'Agendamento confirmado',
        'Seu agendamento com ' || COALESCE(v_expert_name, 'o perito') ||
          ' para ' || TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' ||
          NEW.start_time::text || ' foi confirmado.',
        jsonb_build_object('appointment_id', NEW.id)
      );

    ELSIF NEW.status = 'cancelled' THEN
      -- Appointment cancelled → notify the other party
      IF NEW.cancelled_by = NEW.expert_id THEN
        SELECT full_name INTO v_expert_name FROM profiles WHERE id = NEW.expert_id;
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
          NEW.client_id,
          'appointment_cancelled',
          'Agendamento cancelado',
          COALESCE(v_expert_name, 'O perito') || ' cancelou o agendamento do dia ' ||
            TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.start_time::text || '.' ||
            CASE WHEN NEW.cancellation_reason IS NOT NULL
              THEN ' Motivo: ' || NEW.cancellation_reason ELSE '' END,
          jsonb_build_object('appointment_id', NEW.id)
        );
      ELSE
        SELECT full_name INTO v_client_name FROM profiles WHERE id = NEW.client_id;
        INSERT INTO notifications (user_id, type, title, body, data)
        VALUES (
          NEW.expert_id,
          'appointment_cancelled',
          'Agendamento cancelado pelo cliente',
          COALESCE(v_client_name, 'O cliente') || ' cancelou o agendamento do dia ' ||
            TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' às ' || NEW.start_time::text || '.' ||
            CASE WHEN NEW.cancellation_reason IS NOT NULL
              THEN ' Motivo: ' || NEW.cancellation_reason ELSE '' END,
          jsonb_build_object('appointment_id', NEW.id)
        );
      END IF;

    ELSIF NEW.status = 'completed' THEN
      SELECT full_name INTO v_expert_name FROM profiles WHERE id = NEW.expert_id;
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (
        NEW.client_id,
        'appointment_completed',
        'Consulta realizada',
        'Sua consulta com ' || COALESCE(v_expert_name, 'o perito') ||
          ' do dia ' || TO_CHAR(NEW.appointment_date, 'DD/MM/YYYY') || ' foi concluída.' ||
          ' Avalie o atendimento!',
        jsonb_build_object('appointment_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if recreating
DROP TRIGGER IF EXISTS trg_appointment_notifications ON appointments;

CREATE TRIGGER trg_appointment_notifications
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_notification();

-- Also update the default status to 'pending' to match our type
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending';

NOTIFY pgrst, 'reload schema';
