-- =====================================================
-- СХЕМА БАЗИ ДАНИХ ДЛЯ СИСТЕМИ ОБЛІКУ ВИРОБНИЦТВА
-- Імпортуйте цей файл в Supabase SQL Editor
-- =====================================================

-- Таблиця працівників
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця складу (матеріали)
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'шт',
    min_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця маршрутних листів
CREATE TABLE IF NOT EXISTS route_sheets (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Етапи виробництва (кількість виконаних операцій)
    vtk_count INTEGER DEFAULT 0,                    -- ВТК (15 грн)
    soldering_count INTEGER DEFAULT 0,             -- Припайка роз'ємів (27 грн)
    lacquering_count INTEGER DEFAULT 0,            -- Лакування, батарея, склейка (15 грн)
    stamping_count INTEGER DEFAULT 0,              -- Штампування контактів (0.25 грн)
    fuse_soldering_count INTEGER DEFAULT 0,        -- Спаювання запобіжника (1 грн)
    
    -- Брак
    defect_count INTEGER DEFAULT 0,
    
    -- Обчислювані поля (зберігаємо для швидкості)
    total_amount DECIMAL(10, 2) DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця прив'язки матеріалів до етапів
CREATE TABLE IF NOT EXISTS stage_materials (
    id SERIAL PRIMARY KEY,
    route_sheet_id INTEGER REFERENCES route_sheets(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,  -- vtk, soldering, lacquering, stamping, fuse_soldering
    quantity_used INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблиця історії списання зі складу
CREATE TABLE IF NOT EXISTS inventory_logs (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    route_sheet_id INTEGER REFERENCES route_sheets(id) ON DELETE SET NULL,
    quantity_change INTEGER NOT NULL,  -- від'ємне = списання, додатне = поповнення
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ФУНКЦІЇ ТА ТРИГЕРИ
-- =====================================================

-- Функція для оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригери для оновлення updated_at
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_route_sheets_updated_at
    BEFORE UPDATE ON route_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функція для підрахунку загальної суми маршрутного листа
CREATE OR REPLACE FUNCTION calculate_route_sheet_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount = 
        (NEW.vtk_count * 15) +
        (NEW.soldering_count * 27) +
        (NEW.lacquering_count * 15) +
        (NEW.stamping_count * 0.25) +
        (NEW.fuse_soldering_count * 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для автоматичного підрахунку суми
CREATE TRIGGER calculate_total_before_insert
    BEFORE INSERT ON route_sheets
    FOR EACH ROW EXECUTE FUNCTION calculate_route_sheet_total();

CREATE TRIGGER calculate_total_before_update
    BEFORE UPDATE ON route_sheets
    FOR EACH ROW EXECUTE FUNCTION calculate_route_sheet_total();

-- =====================================================
-- ПРЕДСТАВЛЕННЯ ДЛЯ АНАЛІТИКИ
-- =====================================================

-- Виробництво по працівниках за тиждень
CREATE OR REPLACE VIEW weekly_production AS
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    DATE_TRUNC('week', rs.created_at) as week_start,
    SUM(rs.vtk_count) as total_vtk,
    SUM(rs.soldering_count) as total_soldering,
    SUM(rs.lacquering_count) as total_lacquering,
    SUM(rs.stamping_count) as total_stamping,
    SUM(rs.fuse_soldering_count) as total_fuse_soldering,
    SUM(rs.defect_count) as total_defects,
    SUM(rs.total_amount) as total_earnings
FROM employees e
LEFT JOIN route_sheets rs ON e.id = rs.employee_id
WHERE rs.created_at >= NOW() - INTERVAL '4 weeks'
GROUP BY e.id, e.name, DATE_TRUNC('week', rs.created_at)
ORDER BY week_start DESC, e.name;

-- Виробництво по працівниках за місяць
CREATE OR REPLACE VIEW monthly_production AS
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    DATE_TRUNC('month', rs.created_at) as month_start,
    SUM(rs.vtk_count) as total_vtk,
    SUM(rs.soldering_count) as total_soldering,
    SUM(rs.lacquering_count) as total_lacquering,
    SUM(rs.stamping_count) as total_stamping,
    SUM(rs.fuse_soldering_count) as total_fuse_soldering,
    SUM(rs.defect_count) as total_defects,
    SUM(rs.total_amount) as total_earnings
FROM employees e
LEFT JOIN route_sheets rs ON e.id = rs.employee_id
WHERE rs.created_at >= NOW() - INTERVAL '12 months'
GROUP BY e.id, e.name, DATE_TRUNC('month', rs.created_at)
ORDER BY month_start DESC, e.name;

-- Статистика браку
CREATE OR REPLACE VIEW defect_statistics AS
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    COUNT(rs.id) as total_sheets,
    SUM(rs.defect_count) as total_defects,
    SUM(rs.vtk_count + rs.soldering_count + rs.lacquering_count + 
        rs.stamping_count + rs.fuse_soldering_count) as total_operations,
    CASE 
        WHEN SUM(rs.vtk_count + rs.soldering_count + rs.lacquering_count + 
                 rs.stamping_count + rs.fuse_soldering_count) > 0 
        THEN ROUND(
            (SUM(rs.defect_count)::DECIMAL / 
             SUM(rs.vtk_count + rs.soldering_count + rs.lacquering_count + 
                 rs.stamping_count + rs.fuse_soldering_count)) * 100, 2
        )
        ELSE 0
    END as defect_rate_percent
FROM employees e
LEFT JOIN route_sheets rs ON e.id = rs.employee_id
GROUP BY e.id, e.name
ORDER BY defect_rate_percent DESC;

-- Залишки на складі
CREATE OR REPLACE VIEW inventory_status AS
SELECT 
    i.*,
    CASE 
        WHEN i.quantity <= i.min_quantity THEN 'critical'
        WHEN i.quantity <= i.min_quantity * 2 THEN 'low'
        ELSE 'ok'
    END as status
FROM inventory i
ORDER BY 
    CASE 
        WHEN i.quantity <= i.min_quantity THEN 1
        WHEN i.quantity <= i.min_quantity * 2 THEN 2
        ELSE 3
    END,
    i.name;

-- =====================================================
-- ТЕСТОВІ ДАНІ (ОПЦІОНАЛЬНО)
-- =====================================================

-- Працівники
INSERT INTO employees (name, position) VALUES
    ('Тарас Ільків', 'Монтажник'),
    ('Марія Коваль', 'Монтажник'),
    ('Петро Шевченко', 'Старший монтажник')
ON CONFLICT DO NOTHING;

-- Матеріали на складі
INSERT INTO inventory (name, quantity, unit, min_quantity) VALUES
    ('Роз''єм USB Type-C', 500, 'шт', 100),
    ('Перемикач тактовий', 300, 'шт', 50),
    ('Контакти позолочені', 1000, 'шт', 200),
    ('Лак захисний', 50, 'л', 10),
    ('Батарея Li-Ion 3.7V', 200, 'шт', 50),
    ('Клей епоксидний', 30, 'шт', 5),
    ('Контакти для штампування', 2000, 'шт', 500),
    ('Запобіжник 5A', 400, 'шт', 100)
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS (Row Level Security) для Supabase
-- Розкоментуйте якщо потрібен контроль доступу
-- =====================================================

-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE route_sheets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stage_materials ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all" ON employees FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON inventory FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON route_sheets FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON stage_materials FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON inventory_logs FOR ALL USING (true);
