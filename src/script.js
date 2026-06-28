const presets = {
  "T-Virus": "ACGTGATCGTACGTTAGCAT",
  "G-Virus": "ACGTGATCGAACGTTAGCAT",
  "Progenitor": "TGCAACCGTTAAGGCTTACC",
  "C-Virus": "TGCAACCGTTATGGCTTACC",
  "Tyrant": "ACGTTAGCATCGTACGATTA",
  "Plague": "ACGTTAGCATCGTATGATTA"
};

const dnaA = document.getElementById("dnaA");
const dnaB = document.getElementById("dnaB");
const resultBox = document.getElementById("resultBox");
const presetRow = document.getElementById("presetRow");

function normalizeDNA(value) {
  return value.toUpperCase().replace(/[^ACGT]/g, "");
}

function classifySimilarity(value) {
  if (value >= 80) return "Alta similaridade";
  if (value >= 50) return "Similaridade moderada";
  return "Baixa similaridade";
}

function needlemanWunsch(seq1, seq2, match = 2, mismatch = -1, gap = -2) {
  const m = seq1.length;
  const n = seq2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) dp[i][0] = dp[i - 1][0] + gap;
  for (let j = 1; j <= n; j += 1) dp[0][j] = dp[0][j - 1] + gap;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const score = seq1[i - 1] === seq2[j - 1] ? match : mismatch;
      const diag = dp[i - 1][j - 1] + score;
      const up = dp[i - 1][j] + gap;
      const left = dp[i][j - 1] + gap;
      dp[i][j] = Math.max(diag, up, left);
    }
  }

  const align1 = [];
  const align2 = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    const score = seq1[i - 1] === seq2[j - 1] ? match : mismatch;
    const diag = dp[i - 1][j - 1] + score;
    const up = dp[i - 1][j] + gap;
    const left = dp[i][j - 1] + gap;

    if (dp[i][j] === diag) {
      align1.push(seq1[i - 1]);
      align2.push(seq2[j - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i][j] === up) {
      align1.push(seq1[i - 1]);
      align2.push("-");
      i -= 1;
    } else {
      align1.push("-");
      align2.push(seq2[j - 1]);
      j -= 1;
    }
  }

  while (i > 0) {
    align1.push(seq1[i - 1]);
    align2.push("-");
    i -= 1;
  }
  while (j > 0) {
    align1.push("-");
    align2.push(seq2[j - 1]);
    j -= 1;
  }

  align1.reverse();
  align2.reverse();

  const matches = align1.reduce((acc, char, idx) => acc + (char !== "-" && align2[idx] !== "-" && char === align2[idx] ? 1 : 0), 0);
  const maxLen = Math.max(seq1.length, seq2.length, 1);
  const similarity = Math.round((matches / maxLen) * 100 * 10) / 10;
  return {
    align1: align1.join(""),
    align2: align2.join(""),
    score: dp[m][n],
    similarity,
    matches
  };
}

function renderPresets() {
  presetRow.innerHTML = "";
  Object.keys(presets).forEach((name) => {
    const btn = document.createElement("button");
    btn.className = "preset-btn";
    btn.textContent = name;
    virusA = null;
    btn.addEventListener("click", () => {
      if (!dnaA.value) {
        dnaA.value = presets[name];
        resultBox.innerHTML = `<h3>Resultado</h3><p>Amostra A (${name}) carregada. Selecione uma amostra para B ou digite uma sequência.</p>`;
        virusA = name;
      } else if (!dnaB.value) {
        dnaB.value = presets[name];
        resultBox.innerHTML = `<h3>Resultado</h3><p>Amostra A (${virusA}) e amostra B (${name}) carregadas. Clique em 'Comparar' para ver o resultado.</p>`;
      } else {
        dnaA.value = presets[name];
        dnaB.value = "";
        resultBox.innerHTML = `<h3>Resultado</h3><p>Amostra A alterada para ${name}. Selecione uma amostra para B.</p>`;
        virusA = name;
      }
    });
    presetRow.appendChild(btn);
  });
}

document.getElementById("compareBtn").addEventListener("click", () => {
  const a = normalizeDNA(dnaA.value);
  const b = normalizeDNA(dnaB.value);

  if (!a || !b) {
    resultBox.innerHTML = "<h3>Resultado</h3><p>Preencha as duas sequências com letras A, C, G ou T.</p>";
    return;
  }

  const result = needlemanWunsch(a, b);
  resultBox.innerHTML = `
    <h3>Resultado</h3>
    <div class="metrics">
      <div class="metric"><strong>Score:</strong> ${result.score}</div>
      <div class="metric"><strong>Semelhança:</strong> ${result.similarity}%</div>
      <div class="metric"><strong>Classificação:</strong> ${classifySimilarity(result.similarity)}</div>
    </div>
    <p class="mono">Sequência A: ${result.align1}</p>
    <p class="mono">Sequência B: ${result.align2}</p>
    <p class="mono">Casamentos: ${result.matches}</p>
  `;
});

document.getElementById("clearBtn").addEventListener("click", () => {
  dnaA.value = "";
  dnaB.value = "";
  resultBox.innerHTML = "<h3>Resultado</h3><p>As sequências foram limpas. Insira novos dados para comparar.</p>";
});

renderPresets();
