const tabla = document.getElementById("tablaDatos");
const encabezado = document.getElementById("encabezadoTabla");
const filtroPais = document.getElementById("filtroPais");
const filtroAnio = document.getElementById("filtroAnio");
const buscador = document.getElementById("buscar");

let datosGlobales = [];


document.addEventListener("DOMContentLoaded", () => {
    cargarArchivo('data/01 renewable-share-energy.csv');
});

function cargarArchivo(rutaCSV) {
    Papa.parse(rutaCSV, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(resultado) {
            datosGlobales = resultado.data;
            
            
            const paisSeleccionado = filtroPais.value;
            const anioSeleccionado = filtroAnio.value;

            llenarFiltros();

           
            if ([...filtroPais.options].some(opt => opt.value === paisSeleccionado)) {
                filtroPais.value = paisSeleccionado;
            }
            if ([...filtroAnio.options].some(opt => opt.value === anioSeleccionado)) {
                filtroAnio.value = anioSeleccionado;
            }

            aplicarFiltros();
        }
    });
}

function llenarFiltros() {
    
    filtroPais.innerHTML = '<option value="">Todos</option>';
    filtroAnio.innerHTML = '<option value="">Todos</option>';


    const fragmentoPaises = document.createDocumentFragment();
    const fragmentoAnios = document.createDocumentFragment();


    const paises = [...new Set(datosGlobales.map(fila => fila.Entity))].filter(Boolean).sort();
    paises.forEach(pais => {
        const option = document.createElement("option");
        option.value = pais;
        option.textContent = pais;
        fragmentoPaises.appendChild(option);
    });
    filtroPais.appendChild(fragmentoPaises);


    const anios = [...new Set(datosGlobales.map(fila => fila.Year))].filter(Boolean).sort();
    anios.forEach(anio => {
        const option = document.createElement("option");
        option.value = anio;
        option.textContent = anio;
        fragmentoAnios.appendChild(option);
    });
    filtroAnio.appendChild(fragmentoAnios);
}

function aplicarFiltros() {
    let datosFiltrados = [...datosGlobales];
    const pais = filtroPais.value;
    const anio = filtroAnio.value;
    const texto = buscador.value.toLowerCase();

    if (pais) {
        datosFiltrados = datosFiltrados.filter(fila => fila.Entity === pais);
    }

    if (anio) {
        datosFiltrados = datosFiltrados.filter(fila => fila.Year === anio);
    }

    if (texto) {
        datosFiltrados = datosFiltrados.filter(fila => 
            Object.values(fila).some(valor => 
                String(valor).toLowerCase().includes(texto)
            )
        );
    }

   
    generarTabla(datosFiltrados.slice(0, 121));
}

function generarTabla(datos) {
    tabla.innerHTML = "";
    encabezado.innerHTML = "";

    if (datos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="100%" class="text-center text-muted py-4">No se encontraron registros que coincidan.</td></tr>`;
        return;
    }

    const columnas = Object.keys(datos[0]);

    
    const trCabecera = document.createElement("tr");
    columnas.forEach(columna => {
        const th = document.createElement("th");
        th.textContent = columna;
        trCabecera.appendChild(th);
    });
    encabezado.appendChild(trCabecera);

    
    let filasHTML = "";
    datos.forEach(fila => {
        filasHTML += "<tr>";
        columnas.forEach(columna => {
            filasHTML += `<td>${fila[columna] !== undefined ? fila[columna] : ""}</td>`;
        });
        filasHTML += "</tr>";
    });

    tabla.innerHTML = filasHTML;
}


filtroPais.addEventListener("change", aplicarFiltros);
filtroAnio.addEventListener("change", aplicarFiltros);
buscador.addEventListener("input", aplicarFiltros); 