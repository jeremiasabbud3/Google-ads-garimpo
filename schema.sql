
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50),
    niche VARCHAR(50),
    actualPrice DECIMAL(10,2),
    actualCommPercent DECIMAL(5,2),
    avgCPC DECIMAL(10,2),
    minBidCPC DECIMAL(10,2),
    maxBidCPC DECIMAL(10,2),
    salesPageScore INT,
    link TEXT,
    createdAt BIGINT,
    -- Campos complexos armazenados como JSON string
    financialAnalysis TEXT,
    marketInsights TEXT,
    adsAssets TEXT,
    performance TEXT,
    aiVerdict TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
