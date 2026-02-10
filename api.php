
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Configurações do Banco de Dados - PREENCHA AQUI COM OS DADOS DA HOSTGATOR
$host = 'localhost';
$db   = 'NOME_DO_BANCO_CRIADO';
$user = 'USUARIO_DO_BANCO';
$pass = 'SENHA_DEFINIDA';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['error' => 'Falha na conexão: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM products ORDER BY createdAt DESC");
    $results = $stmt->fetchAll();
    
    // Decodifica os campos JSON de volta para objetos antes de enviar ao React
    foreach ($results as &$row) {
        $row['financialAnalysis'] = json_decode($row['financialAnalysis']);
        $row['marketInsights'] = json_decode($row['marketInsights']);
        $row['adsAssets'] = json_decode($row['adsAssets']);
        $row['performance'] = json_decode($row['performance']);
    }
    echo json_encode($results);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Prepara os dados para inserção (objetos viram strings JSON)
    $sql = "REPLACE INTO products (
                id, name, platform, niche, actualPrice, actualCommPercent, 
                avgCPC, minBidCPC, maxBidCPC, salesPageScore, link, createdAt,
                financialAnalysis, marketInsights, adsAssets, performance, aiVerdict
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['id'], 
        $input['name'], 
        $input['platform'], 
        $input['niche'], 
        $input['actualPrice'], 
        $input['actualCommPercent'], 
        $input['avgCPC'],
        $input['minBidCPC'] ?? null,
        $input['maxBidCPC'] ?? null,
        $input['salesPageScore'], 
        $input['link'], 
        $input['createdAt'],
        json_encode($input['financialAnalysis'] ?? null),
        json_encode($input['marketInsights'] ?? null),
        json_encode($input['adsAssets'] ?? null),
        json_encode($input['performance'] ?? null),
        $input['aiVerdict'] ?? null
    ]);
    
    echo json_encode(['status' => 'success']);
}

if ($method === 'DELETE') {
    $id = $_GET['id'];
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['status' => 'deleted']);
    }
}
?>
