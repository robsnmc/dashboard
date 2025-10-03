const botaoBusca = document.getElementById("botao-busca");
const inputCidade = document.getElementById("cidade");
const graficoEl = document.getElementById("grafico");
const cronometroEl = document.getElementById("cronometro");
const containerAtual = document.querySelector(".resultado-atual-info");
const containerAnterior = document.querySelector(".resultado-anterior-info");

const ctx = graficoEl.getContext("2d");
const grafico = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperatura (°C)",
        data: [],
        borderColor: "#1445A6",
        backgroundColor: "#1445A6",
        fill: false,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: "Eficiência (%)",
        data: [],
        borderColor: "#D9A441",
        backgroundColor: "#D9A441",
        fill: false,
        tension: 0.3,
        yAxisID: 'y1',
      }
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: "Temperatura (°C)" }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: "Eficiência (%)" },
        min: 0,
        max: 100,
        grid: { drawOnChartArea: false }
      }
    },
  },
});

let ultimoResultado = null;
let idDoIntervalo = null;
let idDoCronometro = null;

function iniciarCronometro() {
  clearInterval(idDoCronometro);

  let segundosRestantes = 30;
  cronometroEl.textContent = segundosRestantes;

  idDoCronometro = setInterval(() => {
    segundosRestantes--;
    cronometroEl.textContent = segundosRestantes;

    if (segundosRestantes <= 0) {
      clearInterval(idDoCronometro);
    }
  }, 1000);
}

async function buscarClima() {
  iniciarCronometro();

  const cidade = inputCidade.value;
  if (!cidade) return;

  try {
    const response = await fetch(`/clima/${cidade}`);
    if (!response.ok) {
      containerAtual.innerHTML = `<p>Cidade não encontrada.</p>`;
      containerAnterior.innerHTML = "";
      return;
    }

    const dados = await response.json();

    let htmlAtual = `
      <p>A máquina está atuando na cidade de <strong>${dados.cidade}.</strong><br/><br/></p>
      <p>Temperatura ambiente: ${dados.temperatura}°C.<br/><br/></p>
      <p>Eficiência da máquina: ${dados.eficiencia}.<br/><br/></p>
      <p>Data e hora da consulta: ${new Date(dados.horario).toLocaleString("pt-BR")}.</p>
    `;

    let htmlAnterior = "";
    if (ultimoResultado) {
      htmlAnterior = `
        <p>A máquina estava atuando na cidade de <strong>${ultimoResultado.cidade}.</strong><br/><br/></p>
        <p>Temperatura ambiente: ${ultimoResultado.temperatura}°C.<br/><br/></p>
        <p>Eficiência da máquina: ${ultimoResultado.eficiencia}.<br/><br/></p>
        <p>Data e hora da consulta: ${new Date(ultimoResultado.horario).toLocaleString("pt-BR")}.</p>
      `;
    }

    containerAtual.innerHTML = htmlAtual;
    containerAnterior.innerHTML = htmlAnterior;

    const hora = new Date(dados.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const temperatura = dados.temperatura;

    grafico.data.labels.push(hora);
    grafico.data.datasets[0].data.push(temperatura);

    let eficienciaNum = parseInt(dados.eficiencia.match(/\d+/)[0]);
    grafico.data.datasets[1].data.push(eficienciaNum)

    const maxPontos = 20;
    if (grafico.data.labels.length > maxPontos) {
      grafico.data.labels.shift();
      grafico.data.datasets[0].data.shift();
    }

    grafico.update();
    ultimoResultado = dados;
  } catch (error) {
    containerAtual.innerHTML = `<p>Ocorreu um erro ao buscar os dados.</p>`;
  }
}

botaoBusca.addEventListener("click", () => {
  if (idDoIntervalo) {
    clearInterval(idDoIntervalo);
  }
  buscarClima();
  idDoIntervalo = setInterval(buscarClima, 30000);
});