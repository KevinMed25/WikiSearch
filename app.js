let resultados = [];

document.getElementById("btnBuscar").addEventListener("click", buscar);
document.getElementById("orden").addEventListener("change", ordenarResultados);

function buscar() {
  const q = document.getElementById("query").value;
  if (!q.trim()) return;

  fetch("buscar.php?q=" + encodeURIComponent(q))
    .then(res => res.json())
    .then(data => {
      resultados = data;
      mostrarResultados(resultados);
    })
    .catch(err => {
      console.error("Error:", err);
    });
}

function mostrarResultados(lista) {
  const contenedor = document.getElementById("resultados");
  contenedor.innerHTML = "";
  if (lista.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron resultados.</p>";
    return;
  }

  lista.forEach(item => {
    const div = document.createElement("div");
    div.className = "result";
    div.innerHTML = `
      <a href="${item.url}" target="_blank">${item.title}</a>
      <p>${item.snippet}</p>
      <p class="meta">Última edición: ${item.fecha} | Tamaño: ${item.size} bytes</p>
    `;
    contenedor.appendChild(div);
  });
}

function ordenarResultados() {
  const criterio = document.getElementById("orden").value;
  let ordenados = [...resultados];

  if (criterio === "fecha") {
    ordenados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  } else if (criterio === "tamano") {
    ordenados.sort((a, b) => b.size - a.size);
  }
  // relevancia = orden original

  mostrarResultados(ordenados);
}
