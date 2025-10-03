import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import pkg from 'pg';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = 3000;

const { Pool } = pkg;
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT
});

function calcularEficiencia(temperatura) {
  if (temperatura >= 32) {
    return 'Máxima (100%)';
  } else if (temperatura <= 21) {
    return 'Baixa (23%)';
  }
  const tempMin = 21, tempMax = 32, eficMin = 23, eficMax = 100;
  const fracaoDaTemperatura = (temperatura - tempMin) / (tempMax - tempMin);
  const eficienciaCalculada = eficMin + fracaoDaTemperatura * (eficMax - eficMin);
  return `Variável (${eficienciaCalculada.toFixed(2)}%)`;
}

const API_KEY = process.env.API_KEY;

app.get("/clima/:cidade", async (req, res) => {
  const { cidade } = req.params;
  const API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=metric&lang=pt_br`;

  try {
    const resp = await fetch(API_URL);
    if (!resp.ok) {
      return res.status(resp.status).json({ erro: "Cidade não encontrada" });
    }
    const dados = await resp.json();

    const temperatura = dados.main.temp;
    const eficiencia = calcularEficiencia(temperatura);

    const dadosCidade = {
      cidade: dados.name,
      temperatura: temperatura,
      horario: new Date(),
      eficiencia: eficiencia
    };

    await pool.query(
      `INSERT INTO registro (temperatura, horario, eficiencia) VALUES ($1, $2, $3)`,
      [
        dadosCidade.temperatura,
        dadosCidade.horario,
        dadosCidade.eficiencia
      ]
    );

    res.json(dadosCidade);

  } catch (err) {
    console.error("Erro no servidor ao buscar clima:", err);
    res.status(500).json({ erro: "Erro interno do servidor." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});