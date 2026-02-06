let TEST = [];
let state = {
  i: 0,
  correct: 0,
  answered: false,
  picked: null,
};

const $app = document.getElementById('app');
const $progress = document.getElementById('progress');

function closeTest(){const ok=confirm('Точно выйти? Прогресс будет сброшен.');if(ok){sessionStorage.removeItem('quiz_auth');window.location.href='../login.html';}}



document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeTest');
  if (closeBtn) closeBtn.addEventListener('click', closeTest);
});
async function loadTest() {
  const res = await fetch('./data/test.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Не найден ./data/test.json (HTTP ' + res.status + ')');
  return await res.json();
}

function setProgress() {
  if (!TEST.length) {
    $progress.textContent = 'Загрузка…';
    return;
  }
  const total = TEST.length;
  const current = Math.min(state.i + 1, total);
  $progress.textContent = `Вопрос ${current} из ${total} • Правильно: ${state.correct}`;
}

function renderQuestion() {
  setProgress();
  const q = TEST[state.i];

  const optionsHtml = q.answers.map((text, idx) => {
    return `<button class="option" data-idx="${idx}" type="button">${escapeHtml(text)}</button>`;
  }).join('');

  $app.innerHTML = `
    <h2 class="q-title">${escapeHtml(q.question)}</h2>
    <div class="options" id="options">${optionsHtml}</div>
    <div class="footer">
      <div class="hint">${state.answered ? 'Нажми «Далее»' : 'Выбери вариант (пропускать нельзя)'}</div>
      <div style="display:flex; gap:10px; align-items:center;">
        <button id="restart" class="btn secondary" type="button">С начала</button>
        <button id="next" class="btn" type="button" ${state.answered ? '' : 'disabled'}>Далее</button>
      </div>
    </div>
  `;

  document.getElementById('restart').onclick = restart;

  const $next = document.getElementById('next');
  $next.onclick = next;

  const $options = document.getElementById('options');
  $options.querySelectorAll('.option').forEach(btn => {
    btn.onclick = () => pickAnswer(parseInt(btn.dataset.idx, 10));
  });
}

function pickAnswer(idx) {
  if (state.answered) return; // нельзя менять ответ после выбора (как экзамен)

  const q = TEST[state.i];
  state.answered = true;
  state.picked = idx;

  const isCorrect = idx === q.correct;
  if (isCorrect) state.correct += 1;

  // Подсветка: выбранный неправильный — красным/подчёркнутым,
  // правильный — зелёным (всегда показываем после ответа).
  const buttons = document.querySelectorAll('.option');
  buttons.forEach((b, bIdx) => {
    b.classList.add('disabled');
    if (bIdx === q.correct) b.classList.add('correct');
    if (!isCorrect && bIdx === idx) b.classList.add('wrong');
  });

  document.getElementById('next').disabled = false;
  document.querySelector('.hint').textContent = isCorrect ? '✅ Верно! Нажми «Далее»' : '❌ Неверно. Правильный ответ выделен зелёным. Нажми «Далее»';
  setProgress();
}

function next() {
  if (!state.answered) return; // пропускать нельзя
  state.i += 1;

  if (state.i >= TEST.length) {
    renderResult();
    return;
  }

  state.answered = false;
  state.picked = null;
  renderQuestion();
}

function renderResult() {
  const total = TEST.length;
  const percent = total ? Math.round((state.correct / total) * 100) : 0;

  $progress.textContent = `Готово • Правильно: ${state.correct} из ${total}`;

  $app.innerHTML = `
    <div class="result">
      <h2>Результат</h2>
      <div class="big">${percent}%</div>
      <div class="small">Правильных ответов: ${state.correct} из ${total}</div>
      <div style="height:14px"></div>
      <button class="btn" id="restart2" type="button">Пройти ещё раз</button>
    </div>
  `;
  document.getElementById('restart2').onclick = restart;
}

function restart() {
  state = { i: 0, correct: 0, answered: false, picked: null };
  renderQuestion();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

loadTest()
  .then((data) => {
    TEST = data;
    restart();
  })
  .catch((err) => {
    console.error(err);
    $app.innerHTML = `<div style="color:#fca5a5"><b>Ошибка:</b> ${escapeHtml(err.message || String(err))}</div>`;
    $progress.textContent = 'Ошибка загрузки';
  });
