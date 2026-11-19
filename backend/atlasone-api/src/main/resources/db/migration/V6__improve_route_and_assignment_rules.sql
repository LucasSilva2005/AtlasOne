
-- V6: Aperfeiçoamento das regras de rotas e aceites

-- =====================================================
-- 1. AJUSTAR O CONTROLE DE ENTREGAS EM ROTAS ATIVAS
-- =====================================================

DROP INDEX uq_route_stops_active_delivery;

-- Apenas paradas pendentes ou em andamento bloqueiam
-- a inclusão da entrega em outra rota.
CREATE UNIQUE INDEX uq_route_stops_active_delivery
    ON route_stops (organization_id, delivery_id)
    WHERE removed_at IS NULL
      AND status IN ('pending', 'arrived');


-- =====================================================
-- 2. VALIDAR MOTORISTAS NOS ACEITES
-- =====================================================

CREATE OR REPLACE FUNCTION validate_delivery_assignment_driver()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(30);
    user_status VARCHAR(20);
BEGIN
    SELECT role, status
      INTO user_role, user_status
      FROM app_users
     WHERE organization_id = NEW.organization_id
       AND id = NEW.driver_user_id
     FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Motorista não encontrado nesta empresa.';
    END IF;

    IF user_role <> 'driver' THEN
        RAISE EXCEPTION 'Somente usuários com perfil driver podem aceitar entregas.';
    END IF;

    IF NEW.status = 'accepted' AND user_status <> 'active' THEN
        RAISE EXCEPTION 'Motorista inativo não pode aceitar entregas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_delivery_assignment_driver
BEFORE INSERT OR UPDATE OF organization_id, driver_user_id, status
ON delivery_assignments
FOR EACH ROW
EXECUTE FUNCTION validate_delivery_assignment_driver();


-- =====================================================
-- 3. VALIDAR MOTORISTAS NA CRIAÇÃO DE ROTAS
-- =====================================================

CREATE OR REPLACE FUNCTION validate_route_driver()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(30);
    user_status VARCHAR(20);
BEGIN
    SELECT role, status
      INTO user_role, user_status
      FROM app_users
     WHERE organization_id = NEW.organization_id
       AND id = NEW.driver_user_id
     FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Motorista não encontrado nesta empresa.';
    END IF;

    IF user_role <> 'driver' THEN
        RAISE EXCEPTION 'Somente usuários com perfil driver podem possuir rotas.';
    END IF;

    IF TG_OP = 'INSERT' AND user_status <> 'active' THEN
        RAISE EXCEPTION 'Motorista inativo não pode receber novas rotas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_route_driver
BEFORE INSERT OR UPDATE OF organization_id, driver_user_id
ON routes
FOR EACH ROW
EXECUTE FUNCTION validate_route_driver();


-- =====================================================
-- 4. VALIDAR ACEITE E ROTA ANTES DE CRIAR UMA PARADA
-- =====================================================

CREATE OR REPLACE FUNCTION validate_route_stop_assignment()
RETURNS TRIGGER AS $$
DECLARE
    assignment_status VARCHAR(20);
    route_status VARCHAR(20);
BEGIN
    SELECT status
      INTO assignment_status
      FROM delivery_assignments
     WHERE organization_id = NEW.organization_id
       AND id = NEW.assignment_id
       AND delivery_id = NEW.delivery_id
       AND driver_user_id = NEW.driver_user_id
     FOR UPDATE;

    IF NOT FOUND OR assignment_status <> 'accepted' THEN
        RAISE EXCEPTION 'A entrega precisa possuir um aceite ativo do motorista.';
    END IF;

    SELECT status
      INTO route_status
      FROM routes
     WHERE organization_id = NEW.organization_id
       AND id = NEW.route_id
       AND driver_user_id = NEW.driver_user_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rota não encontrada para este motorista.';
    END IF;

    IF route_status <> 'planned' THEN
        RAISE EXCEPTION 'Somente rotas planejadas podem receber novas paradas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_route_stop_assignment
BEFORE INSERT OR UPDATE OF
    organization_id,
    route_id,
    delivery_id,
    assignment_id,
    driver_user_id
ON route_stops
FOR EACH ROW
EXECUTE FUNCTION validate_route_stop_assignment();


-- =====================================================
-- 5. IMPEDIR LIBERAÇÃO DE ENTREGA EM ROTA ATIVA
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_assignment_release_with_active_stop()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'accepted'
       AND NEW.status <> 'accepted'
       AND EXISTS (
           SELECT 1
             FROM route_stops
            WHERE organization_id = OLD.organization_id
              AND assignment_id = OLD.id
              AND removed_at IS NULL
              AND status IN ('pending', 'arrived')
       )
    THEN
        RAISE EXCEPTION
            'Não é possível liberar o aceite enquanto a entrega estiver em uma rota ativa.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_assignment_release
BEFORE UPDATE OF status
ON delivery_assignments
FOR EACH ROW
EXECUTE FUNCTION prevent_assignment_release_with_active_stop();


-- =====================================================
-- 6. LIBERAR PARADAS AO CANCELAR UMA ROTA
-- =====================================================

CREATE OR REPLACE FUNCTION release_stops_when_route_cancelled()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled'
       AND OLD.status <> 'cancelled'
    THEN
        UPDATE route_stops
           SET status = 'removed',
               removed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = NEW.organization_id
           AND route_id = NEW.id
           AND removed_at IS NULL
           AND status IN ('pending', 'arrived');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_release_stops_when_route_cancelled
AFTER UPDATE OF status
ON routes
FOR EACH ROW
EXECUTE FUNCTION release_stops_when_route_cancelled();
