<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

// --- Lógica de Autocompletado ---
if (isset($_GET['action']) && $_GET['action'] === 'autocomplete') {
    if (!isset($_GET["q"]) || trim($_GET["q"]) === "") {
        echo json_encode([]);
        exit;
    }
    $query = urlencode($_GET["q"]);
    $lang = $_GET["lang"] ?? 'es';
    $allowed_langs = ['es', 'en', 'fr', 'de', 'it'];
    if (!in_array($lang, $allowed_langs)) {
        $lang = 'es';
    }

    $url = "https://{$lang}.wikipedia.org/w/api.php?action=opensearch&search={$query}&limit=10&namespace=0&format=json";
    
    $options = [ "http" => [ "header" => "User-Agent: WikiSearchApp/1.0 (contact: your-email@example.com)\r\n" ] ];
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);

    if ($response === FALSE) {
        echo json_encode([]);
        exit;
    }

    $data = json_decode($response, true);
    // El formato opensearch devuelve un array, el segundo item ([1]) es la lista de sugerencias
    $suggestions = $data[1] ?? [];
    
    echo json_encode($suggestions, JSON_UNESCAPED_UNICODE);
    exit; // Detener el script aquí para no ejecutar la búsqueda completa
}

// --- Lógica de Búsqueda Completa ---
if (!isset($_GET["q"]) || trim($_GET["q"]) === "") {
    echo json_encode([]);
    exit;
}

$query = urlencode($_GET["q"]);
$sort = $_GET["sort"] ?? 'relevancia';
$dir = $_GET["dir"] ?? 'desc';
$lang = $_GET["lang"] ?? 'es';
$limit = $_GET["limit"] ?? 10;

// Whitelist de idiomas para seguridad
$allowed_langs = ['es', 'en', 'fr', 'de', 'it'];
if (!in_array($lang, $allowed_langs)) {
    $lang = 'es'; // Si no es válido, vuelve a español por defecto
}

// Whitelist de dirección para seguridad
if (!in_array($dir, ['asc', 'desc'])) {
    $dir = 'desc';
}

// Whitelist para el límite de resultados (máximo 50 para usuarios no-bot)
$allowed_limits = [10, 25, 50];
if (!in_array($limit, $allowed_limits)) {
    $limit = 10;
}

$sortMapping = [
    'relevancia' => 'relevance',
    'fecha' => 'last_edit', // Se añade _asc o _desc después
    // 'tamano' se gestiona en PHP ya que la API no lo soporta en la búsqueda
];
$apiSortParam = null;
$apiSortBase = $sortMapping[$sort] ?? null;
if ($apiSortBase) {
    $apiSortParam = ($apiSortBase === 'relevance') ? 'relevance' : "{$apiSortBase}_{$dir}";
}

// Endpoint de la API de Wikipedia
$url = "https://{$lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch={$query}&utf8=&format=json&srprop=snippet|timestamp|size&srinfo=totalhits&srlimit={$limit}";
if ($apiSortParam) {
    $url .= "&srsort={$apiSortParam}";
}

//contexto HTTP
$options = [
    "http" => [
        "header" => "User-Agent: WikiSearchApp/1.0 (contact: your-email@example.com)\r\n"
    ]
];
$context = stream_context_create($options);

// Consumir API
$response = file_get_contents($url, false, $context);
if ($response === FALSE) {
    echo json_encode([]);
    exit;
}

$data = json_decode($response, true);
$resultados = [];
$totalHits = 0;

if (isset($data["query"]["search"])) {
    $totalHits = $data["query"]["searchinfo"]["totalhits"] ?? 0;

    foreach ($data["query"]["search"] as $item) {
        $titulo = $item["title"];
        $snippet = strip_tags($item["snippet"]);
        $fecha = $item["timestamp"];
        $tamano = $item["size"];
        $urlArticulo = "https://{$lang}.wikipedia.org/wiki/" . urlencode($titulo);

        $resultados[] = [
            "title" => $titulo,
            "snippet" => $snippet,
            "fecha" => $fecha,
            "size" => $tamano,
            "url" => $urlArticulo
        ];
    }
}

// Si se solicitó ordenar por tamaño, lo hacemos aquí usando PHP
if ($sort === 'tamano') {
    usort($resultados, function($a, $b) use ($dir) {
        if ($dir === 'desc') {
            return $b['size'] <=> $a['size']; // Orden descendente
        } else {
            return $a['size'] <=> $b['size']; // Orden ascendente
        }
    });
}

$finalResponse = [
    'total' => $totalHits,
    'resultados' => $resultados
];

echo json_encode($finalResponse, JSON_UNESCAPED_UNICODE);
