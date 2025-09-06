document.addEventListener('DOMContentLoaded', () => {
  const btnBuscar = document.getElementById('btnBuscar');
  const queryInput = document.getElementById('query');
  const resultadosDiv = document.getElementById('resultados');
  const ordenSelect = document.getElementById('orden');
  const langSelect = document.getElementById('lang');
  const direccionSelect = document.getElementById('direccion');
  const limitSelect = document.getElementById('limit');
  const infoResultadosDiv = document.getElementById('info-resultados');
  const suggestionsDiv = document.getElementById('autocomplete-suggestions');
  const searchContainer = document.querySelector('.search-container');
  const controlsWrapper = document.querySelector('.controls-wrapper');
  const mainContent = document.getElementById('main-content');
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');

  let activeSuggestionIndex = -1;
  let currentSuggestions = [];
  let searchPerformed = false;

  const toggleDireccionSelect = () => {
    // La relevancia no tiene dirección ascendente/descendente
    if (ordenSelect.value === 'relevancia') {
      direccionSelect.disabled = true;
      direccionSelect.value = 'desc'; // Reset a un valor por defecto
    } else {
      direccionSelect.disabled = false;
    }
  };

  const hideSuggestions = () => {
    suggestionsDiv.innerHTML = '';
    suggestionsDiv.classList.add('hidden');
    activeSuggestionIndex = -1;
    currentSuggestions = [];
  };

  const showSuggestions = (suggestions) => {
    hideSuggestions(); // Limpiar las anteriores
    currentSuggestions = suggestions;

    if (suggestions.length === 0) return;

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div');
      item.className = 'suggestion-item px-4 py-2 cursor-pointer hover:bg-indigo-50';
      item.textContent = suggestion;
      item.addEventListener('click', () => {
        queryInput.value = suggestion;
        hideSuggestions();
        buscar();
      });
      suggestionsDiv.appendChild(item);
    });

    suggestionsDiv.classList.remove('hidden');
  };

  const handleAutocomplete = async () => {
    const query = queryInput.value.trim();
    if (query.length < 2) {
      hideSuggestions();
      return;
    }
    const lang = langSelect.value;
    try {
      const response = await fetch(`buscar.php?action=autocomplete&q=${encodeURIComponent(query)}&lang=${lang}`);
      const suggestions = await response.json();
      showSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching autocomplete:', error);
    }
  };

  const buscar = async () => {
    const query = queryInput.value.trim();
    const orden = ordenSelect.value;
    const lang = langSelect.value;
    const direccion = direccionSelect.value;
    const limit = limitSelect.value;

    hideSuggestions();

    if (query === '') {
      resultadosDiv.innerHTML = '<p class="text-center text-slate-500 py-8">Por favor, escribe algo para buscar.</p>';
      infoResultadosDiv.innerHTML = '';
      return;
    }

    searchPerformed = true;
    // Mueve el contenido hacia arriba y muestra los filtros
    mainContent.classList.remove('pt-40', 'md:pt-48');
    controlsWrapper.classList.remove('hidden');

    resultadosDiv.innerHTML = '<p class="text-center text-slate-500 py-8 animate-pulse">Buscando...</p>';
    infoResultadosDiv.innerHTML = '';

    try {
      // Pasamos la consulta y el orden al backend
      const response = await fetch(`buscar.php?q=${encodeURIComponent(query)}&sort=${orden}&dir=${direccion}&lang=${lang}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      mostrarResultados(data);

    } catch (error) {
      console.error('Error al buscar:', error);
      resultadosDiv.innerHTML = '<p class="text-center text-red-500 py-8">Ocurrió un error al realizar la búsqueda. Por favor, intenta de nuevo.</p>';
    }
  };

  const mostrarResultados = (data) => {
    const { resultados, total } = data;
    resultadosDiv.innerHTML = ''; // Limpiar resultados anteriores
    infoResultadosDiv.innerHTML = ''; // Limpiar info anterior

    // Mostrar el total de resultados
    if (total > 0) {
      const totalFormateado = new Intl.NumberFormat('es-ES').format(total);
      infoResultadosDiv.innerHTML = `<p class="text-sm text-slate-600">Aproximadamente ${totalFormateado} resultados encontrados.</p>`;
    }

    if (resultados.length === 0) {
      resultadosDiv.innerHTML = '<p class="text-center text-slate-500 py-8">No se encontraron resultados para tu búsqueda.</p>';
      return;
    }

    resultados.forEach(item => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'result bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all border-l-4 border-l-indigo-600';

      const fechaFormateada = new Date(item.fecha).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // Convertir tamaño a KB para mejor lectura
      const tamanoEnKB = (item.size / 1024).toFixed(2);

      resultDiv.innerHTML = `
        <a href="${item.url}" target="_blank" class="text-xl font-bold text-indigo-600 hover:text-indigo-800 hover:underline">${item.title}</a>
        <p class="text-slate-600 my-2">${item.snippet}...</p>
        <div class="meta text-sm text-slate-500 mt-3 flex flex-wrap gap-x-3">
          <span>Última edición: ${fechaFormateada}</span>
          <span class="hidden sm:inline">&bull;</span>
          <span>Tamaño: ${tamanoEnKB} KB</span>
        </div>
      `;
      resultadosDiv.appendChild(resultDiv);
    });
  };

  const handleScroll = () => {
    // Muestra el botón solo si se ha buscado y se ha hecho scroll hacia abajo
    if (searchPerformed && window.scrollY > 300) {
      scrollToTopBtn.classList.remove('hidden');
    } else {
      scrollToTopBtn.classList.add('hidden');
    }
  };

  // Event Listeners
  window.addEventListener('scroll', handleScroll);

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  btnBuscar.addEventListener('click', buscar);

  queryInput.addEventListener('input', handleAutocomplete);

  queryInput.addEventListener('keydown', (e) => {
    const { key } = e;
    const items = suggestionsDiv.querySelectorAll('.suggestion-item');

    if (key === 'ArrowDown') {
      e.preventDefault();
      if (activeSuggestionIndex < items.length - 1) activeSuggestionIndex++;
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      if (activeSuggestionIndex > 0) activeSuggestionIndex--;
    } else if (key === 'Escape') {
      hideSuggestions();
      return;
    } else if (key === 'Enter') {
      if (activeSuggestionIndex > -1 && items[activeSuggestionIndex]) {
        e.preventDefault(); // Prevenir que se envíe un formulario (si lo hubiera)
        items[activeSuggestionIndex].click(); // Simular clic en la sugerencia activa
      } else {
        buscar(); // Comportamiento normal de búsqueda
      }
      return;
    }

    items.forEach(item => item.classList.remove('bg-indigo-50'));
    if (items[activeSuggestionIndex]) {
      items[activeSuggestionIndex].classList.add('bg-indigo-50');
    }
  });

  ordenSelect.addEventListener('change', () => {
    toggleDireccionSelect();
    // Si ya hay una búsqueda, la ejecuta de nuevo con el nuevo orden
    if (queryInput.value.trim() !== '') {
      buscar();
    }
  });

  direccionSelect.addEventListener('change', () => {
    if (queryInput.value.trim() !== '' && !direccionSelect.disabled) {
      buscar();
    }
  });

  limitSelect.addEventListener('change', () => {
    if (queryInput.value.trim() !== '') {
      buscar();
    }
  });

  langSelect.addEventListener('change', () => {
    // Si ya hay una búsqueda, la ejecuta de nuevo con el nuevo idioma
    if (queryInput.value.trim() !== '') {
      buscar();
    }
  });

  // Ocultar sugerencias si se hace clic fuera del área de búsqueda
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      hideSuggestions();
    }
  });

  // Estado inicial del selector de dirección
  toggleDireccionSelect();
});
