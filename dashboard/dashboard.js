let renovables = [];
let solar = [];
let eolica = [];
let hidro = [];
let geotermica = [];
let eolicaCapacidad = [];
let solarCapacidad = [];
let consumoRenovable = [];

let barraChart;
let tortaChart;
let lineaChart;
let areaChart;

const COLORES = {
  solar: '#ffc107',      
  eolica: '#007bff',     
  hidro: '#17a2b8',     
  geotermica: '#6c757d', 
  renovable: '#198754',  
  convencional: '#dc3545'
};


Promise.all([
  cargarCSV("data/01 renewable-share-energy.csv"),
  cargarCSV("data/12 solar-energy-consumption.csv"),
  cargarCSV("data/08 wind-generation.csv"),
  cargarCSV("data/05 hydropower-consumption.csv"),
  cargarCSV("data/17 installed-geothermal-capacity.csv"),
  cargarCSV("data/09 cumulative-installed-wind-energy-capacity-gigawatts.csv"),
  cargarCSV("data/13 installed-solar-PV-capacity.csv"),
  cargarCSV("data/02 modern-renewable-energy-consumption.csv"),
]).then((resultados) => {
  renovables = resultados[0];
  solar = resultados[1];
  eolica = resultados[2];
  hidro = resultados[3];
  geotermica = resultados[4];
  eolicaCapacidad = resultados[5];
  solarCapacidad = resultados[6];
  consumoRenovable = resultados[7];
  
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
  const select = document.getElementById("pais");
  const paises = [...new Set(renovables.map((fila) => fila.Entity))].filter(Boolean).sort();

  let opcionesHTML = "";
  paises.forEach((pais) => {
    opcionesHTML += `<option value="${pais}">${pais}</option>`;
  });
  select.innerHTML = opcionesHTML;

  
  select.addEventListener("change", cargarAnios);
  

  if (paises.length > 0) {
    select.value = paises[0];
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
    actualizarDashboard();
  }
}

function valorDataset(dataset, pais, anio) {
  
  const registro = dataset.find(
    (fila) => fila.Entity === pais && String(fila.Year) === String(anio),
  );

  if (!registro) return 0;

  const columnas = Object.keys(registro);
  return parseFloat(registro[columnas[3]]) || 0;
}

function actualizarDashboard() {
  const pais = document.getElementById("pais").value;
  const anio = document.getElementById("anio").value;

  if (!pais || !anio) return;

  const solarValor = valorDataset(solar, pais, anio);
  const eolicaValor = valorDataset(eolica, pais, anio);
  const hidroValor = valorDataset(hidro, pais, anio);
  const geoValor = valorDataset(geotermica, pais, anio);

  
  document.getElementById("kpiSolar").textContent = solarValor.toFixed(2);
  document.getElementById("kpiEolica").textContent = eolicaValor.toFixed(2);
  document.getElementById("kpiHidro").textContent = hidroValor.toFixed(2);
  document.getElementById("kpiGeo").textContent = geoValor.toFixed(2);


  crearBarra(solarValor, eolicaValor, hidroValor, geoValor);
  crearTorta(solarValor, eolicaValor, hidroValor, geoValor);
  crearLinea(pais);
  crearArea(pais);
}


function crearBarra(solar, eolica, hidro, geo) {
  if (barraChart) barraChart.destroy();

  barraChart = new Chart(document.getElementById("graficoBarra"), {
    type: "bar",
    data: {
      labels: ["Solar", "Eólica", "Hidro", "Geotérmica"],
      datasets: [{
        label: "Producción (TWh)",
        data: [solar, eolica, hidro, geo],
        backgroundColor: [COLORES.solar, COLORES.eolica, COLORES.hidro, COLORES.geotermica],
        borderWidth: 0,
        borderRadius: 5
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

function crearTorta(solar, eolica, hidro, geo) {
  if (tortaChart) tortaChart.destroy();

  const tieneDatos = (solar + eolica + hidro + geo) > 0;

  tortaChart = new Chart(document.getElementById("graficoTorta"), {
    type: "pie",
    data: {
      labels: ["Solar", "Eólica", "Hidro", "Geotérmica"],
      datasets: [{
        data: tieneDatos ? [solar, eolica, hidro, geo] : [0, 0, 0, 1],
        backgroundColor: tieneDatos 
          ? [COLORES.solar, COLORES.eolica, COLORES.hidro, COLORES.geotermica]
          : ['#e9ecef'] 
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function crearLinea(pais) {
  if (lineaChart) lineaChart.destroy();

  const anios = [];
  const solarDatos = [];
  const eolicaDatos = [];
  const geoDatos = [];


  const filasFiltradas = renovables
    .filter((fila) => fila.Entity === pais)
    .sort((a, b) => parseInt(a.Year) - parseInt(b.Year));

  filasFiltradas.forEach((fila) => {
    const anio = fila.Year;
    anios.push(anio);
    solarDatos.push(valorDataset(solarCapacidad, pais, anio));
    eolicaDatos.push(valorDataset(eolicaCapacidad, pais, anio));
    geoDatos.push(valorDataset(geotermica, pais, anio));
  });

  lineaChart = new Chart(document.getElementById("graficoLinea"), {
    type: "line",
    data: {
      labels: anios,
      datasets: [
        { label: "Solar", data: solarDatos, borderColor: COLORES.solar, backgroundColor: COLORES.solar, tension: 0.2 },
        { label: "Eólica", data: eolicaDatos, borderColor: COLORES.eolica, backgroundColor: COLORES.eolica, tension: 0.2 },
        { label: "Geotérmica", data: geoDatos, borderColor: COLORES.geotermica, backgroundColor: COLORES.geotermica, tension: 0.2 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function crearArea(pais) {
  if (areaChart) areaChart.destroy();

  const anios = [];
  const renovableDatos = [];
  const convencionalDatos = [];

  const filasFiltradas = consumoRenovable
    .filter((fila) => fila.Entity === pais)
    .sort((a, b) => parseInt(a.Year) - parseInt(b.Year));

  filasFiltradas.forEach((fila) => {
    anios.push(fila.Year);
    const valor = parseFloat(Object.values(fila)[3]) || 0;
    renovableDatos.push(valor);
    convencionalDatos.push(valor * 2); 
  });

  areaChart = new Chart(document.getElementById("graficoArea"), {
    type: "line",
    data: {
      labels: anios,
      datasets: [
        { 
          label: "Renovable", 
          data: renovableDatos, 
          borderColor: COLORES.renovable, 
          backgroundColor: 'rgba(25, 135, 84, 0.2)',
          fill: true,
          tension: 0.1
        },
        { 
          label: "Convencional", 
          data: convencionalDatos, 
          borderColor: COLORES.convencional, 
          backgroundColor: 'rgba(220, 53, 69, 0.1)', 
          fill: true,
          tension: 0.1
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}