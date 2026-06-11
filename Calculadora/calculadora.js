let renovables = [];
let solar = [];
let eolica = [];
let hidro = [];
let geotermica = [];

let grafico = null;


Promise.all([
  cargarCSV("data/01 renewable-share-energy.csv"),
  cargarCSV("data/12 solar-energy-consumption.csv"),
  cargarCSV("data/08 wind-generation.csv"),
  cargarCSV("data/05 hydropower-consumption.csv"),
  cargarCSV("data/17 installed-geothermal-capacity.csv"),
]).then((resultados) => {
  renovables = resultados[0];
  solar = resultados[1];
  eolica = resultados[2];
  hidro = resultados[3];
  geotermica = resultados[4];

  cargarPaises();
});

function cargarCSV(ruta) {
  return new Promise((resolve) => {
    Papa.parse(ruta, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: function (resultado) {
        resolve(resultado.data);
      },
    });
  });
}

function cargarPaises() {
  const selectPais = document.getElementById("pais");
  const countries = [...new Set(renovables.map((fila) => fila.Entity))].filter(Boolean).sort();

  let opcionesHTML = "";
  countries.forEach((pais) => {
    opcionesHTML += `<option value="${pais}">${pais}</option>`;
  });
  selectPais.innerHTML = opcionesHTML;

  if (countries.length > 0) {
    selectPais.value = countries[0];
    cargarAnios();
  }
}

function cargarAnios() {
  const pais = document.getElementById("pais").value;
  const selectAnio = document.getElementById("anio");

  
  const anios = [...new Set(
    renovables
      .filter((fila) => fila.Entity === pais)
      .map((fila) => parseInt(fila.Year))
  )].filter(Boolean).sort((a, b) => a - b);

  let opcionesHTML = "";
  anios.forEach((anio) => {
    opcionesHTML += `<option value="${anio}">${anio}</option>`;
  });
  selectAnio.innerHTML = opcionesHTML;

  if (anios.length > 0) {
    selectAnio.value = anios[anios.length - 1];
  }
}

function obtenerValor(dataset, pais, anio) {
  const registro = dataset.find(
    (fila) => fila.Entity === pais && String(fila.Year) === String(anio),
  );

  if (!registro) return 0;

  const columnas = Object.keys(registro);
  return parseFloat(registro[columnas[3]]) || 0;
}

function calcular() {
  const pais = document.getElementById("pais").value;
  const anio = document.getElementById("anio").value;
  const consumo = parseFloat(document.getElementById("consumo").value);

  if (!consumo || consumo <= 0) {
    alert("Por favor, ingrese un consumo eléctrico válido mayor a 0 kWh.");
    return;
  }

  const registroRenovable = renovables.find(
    (fila) => fila.Entity === pais && String(fila.Year) === String(anio),
  );

  if (!registroRenovable) {
    alert("No existen datos disponibles para el país y año seleccionados.");
    return;
  }

  const columnasRenovables = Object.keys(registroRenovable);
  const porcentajeRenovable = parseFloat(registroRenovable[columnasRenovables[3]]) || 0;

  const energiaRenovable = (consumo * porcentajeRenovable) / 100;
  const energiaConvencional = consumo - energiaRenovable;

  const solarValor = obtenerValor(solar, pais, anio);
  const eolicaValor = obtenerValor(eolica, pais, anio);
  const hidroValor = obtenerValor(hidro, pais, anio);
  const geoValor = obtenerValor(geotermica, pais, anio);

  const totalFuentes = solarValor + eolicaValor + hidroValor + geoValor;

  let solarKwh = 0, eolicaKwh = 0, hidroKwh = 0, geoKwh = 0;

  if (totalFuentes > 0) {
    solarKwh = energiaRenovable * (solarValor / totalFuentes);
    eolicaKwh = energiaRenovable * (eolicaValor / totalFuentes);
    hidroKwh = energiaRenovable * (hidroValor / totalFuentes);
    geoKwh = energiaRenovable * (geoValor / totalFuentes);
  }

  document.getElementById("resultado").innerHTML = `
    <div class="w-100 text-start fade-in">
      <h5 class="card-title-custom mb-3">Resultados del Análisis (${pais} - ${anio})</h5>
      
      <div class="alert alert-success d-flex justify-content-between align-items-center mb-4" role="alert">
        <span>Porcentaje de Energía Limpia en la Red:</span>
        <strong class="fs-5">${porcentajeRenovable.toFixed(2)}%</strong>
      </div>

      <div class="row g-3 mb-4 text-center">
        <div class="col-6">
          <div class="p-3 bg-light rounded-3 border-start border-success border-3">
            <span class="text-muted small d-block">Tu Consumo Limpio</span>
            <strong class="text-success fs-5">${energiaRenovable.toFixed(2)} kWh</strong>
          </div>
        </div>
        <div class="col-6">
          <div class="p-3 bg-light rounded-3 border-start border-danger border-3">
            <span class="text-muted small d-block">Tu Consumo Convencional</span>
            <strong class="text-danger fs-5">${energiaConvencional.toFixed(2)} kWh</strong>
          </div>
        </div>
      </div>

      <h6 class="fw-bold text-secondary mb-3">Desglose Estimado por Fuentes:</h6>
      <ul class="list-group list-group-flush mb-2">
        <li class="list-group-item bg-transparent d-flex justify-content-between">
          <span>☀️ Energía Solar:</span>
          <span class="fw-semibold">${solarKwh.toFixed(2)} kWh</span>
        </li>
        <li class="list-group-item bg-transparent d-flex justify-content-between">
          <span>💨 Energía Eólica:</span>
          <span class="fw-semibold">${eolicaKwh.toFixed(2)} kWh</span>
        </li>
        <li class="list-group-item bg-transparent d-flex justify-content-between">
          <span>💧 Energía Hidroeléctrica:</span>
          <span class="fw-semibold">${hidroKwh.toFixed(2)} kWh</span>
        </li>
        <li class="list-group-item bg-transparent d-flex justify-content-between">
          <span>🌋 Energía Geotérmica:</span>
          <span class="fw-semibold">${geoKwh.toFixed(2)} kWh</span>
        </li>
      </ul>
      
      <p class="text-muted mt-3 text-center small mb-0">Total Consumo Introducido: <strong>${consumo} kWh</strong></p>
    </div>
  `;
}