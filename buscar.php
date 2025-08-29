<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");

if (!isset($_GET["q"]) || trim($_GET["q"]) === "") {
    echo json_encode([]);
    exit;
}

$query = urlencode($_GET["q"]);

// Endpoint de la API de Wikipedia
$url = "https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch={$query}&utf8=&format=json&srprop=snippet|timestamp|size";

//contexto HTTP
$options = [
    "http" => [
        "header" => "User-Agent: WikiSearchApp/1.0 (https://localhost/)\r\n"
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

if (isset($data["query"]["search"])) {
    foreach ($data["query"]["search"] as $item) {
        $titulo = $item["title"];
        $snippet = strip_tags($item["snippet"]);
        $fecha = $item["timestamp"];
        $tamano = $item["size"];
        $urlArticulo = "https://es.wikipedia.org/wiki/" . urlencode($titulo);

        $resultados[] = [
            "title" => $titulo,
            "snippet" => $snippet,
            "fecha" => $fecha,
            "size" => $tamano,
            "url" => $urlArticulo
        ];
    }
}

echo json_encode($resultados, JSON_UNESCAPED_UNICODE);
