-- Habilitar extensión para generar UUIDs automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    preferred_currency VARCHAR(10) DEFAULT 'COP',
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- 2. Tabla de Categorías (Tipos fijos definidos por el sistema)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- ej. 'Ingreso', 'Gasto', 'Suscripción'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Comercios (Merchants)
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_name VARCHAR(255) NOT NULL, -- Nombre crudo del banco (ej. 'COMPRA ESTABLECIMIENTO XYZ')
    clean_name VARCHAR(255),        -- Nombre limpio por la IA (ej. 'Netflix')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Transacciones (El núcleo del sistema)
CREATE TYPE transaction_status AS ENUM ('pending', 'processed', 'failed');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'COP',
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_notification_text TEXT NOT NULL, -- La notificación original intacta
    status transaction_status DEFAULT 'pending', -- Nuevo: Para controlar la asincronía
    is_subscription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE -- Para no borrar registros financieros
);

-- Índices para optimizar las consultas del Dashboard
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_status ON transactions(status);

-- 5. Tabla de Suscripciones Detectadas
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    estimated_amount DECIMAL(12, 2) NOT NULL,
    frequency VARCHAR(50) NOT NULL, -- ej. 'Mensual', 'Anual'
    next_billing_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Retroalimentación y Logs de IA (Para reentrenamiento - HU-13)
CREATE TABLE ai_corrections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    original_category_id UUID REFERENCES categories(id),
    corrected_category_id UUID REFERENCES categories(id),
    prompt_used JSONB, -- Nuevo: Guarda el prompt exacto enviado a OpenAI/Gemini
    llm_response JSONB, -- Nuevo: Guarda el JSON exacto que devolvió la IA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);