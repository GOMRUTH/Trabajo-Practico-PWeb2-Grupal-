//http://localhost:7050/datos
const express = require("express");
const morgan = require("morgan");
const fs = require('fs');
const asciichart = require("asciichart");

const app = express();

app.use(morgan("dev"));
app.use(express.json());

//Lectura del archivo JSON
let data = fs.readFileSync('./data/medicamentos_cobertura.json');
let datos = JSON.parse(data);


//Mostrar tabla al arrancar
console.log("\n📋 Lista inicial de medicamentos:");
console.table(datos.slice(0, 9)); // Solo 9 datos ingresados manualmente

// Función que busca medicamento repetido
function buscarRepetidos(medicamento) {
  return datos.some(x =>
    x.MARCA === medicamento.MARCA &&
    x.DROGA === medicamento.DROGA &&
    x.PRESENTACION === medicamento.PRESENTACION
  );
}

// GET - lista completa
app.get("/datos", (req, res) => {
  console.table(datos.slice(0, 10)); // Mostrar 10 primeros en consola
  res.json(datos);
});

// POST - agregar medicamento
app.post("/datos", (req, res) => {
  const nuevoMedicamento = req.body;
  if (buscarRepetidos(nuevoMedicamento)) {
    return res.status(200).json({ message: "Producto ya creado" });
  } else {
    datos.push(nuevoMedicamento);
    fs.writeFileSync("./data/medicamentos_cobertura.json", JSON.stringify(datos));
    return res.status(201).json(nuevoMedicamento);
  }
});

// PUT - modificar medicamento por MARCA y LABORATORIO
app.put("/datos", (req, res) => {
  const medicamento = req.body;
  let encontrado = false;

  datos = datos.map(m => {
    if (m.MARCA === medicamento.MARCA && m.LABORATORIO === medicamento.LABORATORIO) {
      encontrado = true;
      return { ...m, ...medicamento };
    }
    return m;
  });

  if (encontrado) {
    fs.writeFileSync("./data/medicamentos_cobertura.json", JSON.stringify(datos));
    return res.json({ message: "Producto actualizado", medicamento });
  } else {
    return res.status(204).json({ message: "Producto no encontrado" });
  }
});

// DELETE - eliminar por MARCA
app.delete("/datos", (req, res) => {
  const medicamento = req.body;
  const inicial = datos.length;
  datos = datos.filter(m => m.MARCA !== medicamento.MARCA);

  if (datos.length < inicial) {
    fs.writeFileSync("./data/medicamentos_cobertura.json", JSON.stringify(datos));
    return res.sendStatus(200);
  } else {
    return res.status(204).json({ message: "Producto no encontrado" });
  }
});

// GET - buscar por laboratorio
app.get("/datos/laboratorio/:lab", (req, res) => {
  const lab = req.params.lab.toLowerCase();
  const resultado = datos.filter(m => m.LABORATORIO?.toLowerCase().includes(lab));

  resultado.length
    ? res.status(200).json(resultado)
    : res.status(204).json({ message: "No se encontraron medicamentos" });
});

// GET - buscar por droga
app.get("/datos/droga/:droga", (req, res) => {
  const droga = req.params.droga.toLowerCase();
  const resultado = datos.filter(m => m.DROGA?.toLowerCase().includes(droga));

  resultado.length
    ? res.status(200).json(resultado)
    : res.status(204).json({ message: "No se encontraron medicamentos" });
});

// GET - cobertura < 50%
app.get("/datos/cobertura/baja", (req, res) => {
  const resultado = datos.filter(m => {
    const cobertura = parseFloat(m.COBERTURA.replace("%", "").trim());
    return cobertura < 50;
  });

  resultado.length
    ? res.status(200).json(resultado)
    : res.status(204).json({ message: "No se encontraron medicamentos con baja cobertura" });
});

// DELETE - eliminar por laboratorio
app.delete("/datos/laboratorio/:lab", (req, res) => {
  const laboratorio = req.params.lab.toLowerCase();
  const antes = datos.length;
  datos = datos.filter(m => m.LABORATORIO.toLowerCase() !== laboratorio);
  const eliminados = antes - datos.length;

  if (eliminados > 0) {
    fs.writeFileSync("./data/medicamentos_cobertura.json", JSON.stringify(datos));
    return res.status(200).json({ message: `${eliminados} medicamentos eliminados` });
  } else {
    return res.status(204).json({ message: "No se encontraron medicamentos para eliminar" });
  }
});

app.listen(7050, () => {
  console.log(" Servidor corriendo en http://localhost:7050");
});
