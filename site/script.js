function setMessage(message) {
  const tests = document.getElementById("tests");
  tests.innerHTML = "";
  tests.add(new Option(message, ""));
  tests.disabled = true;
  tests.size = 1;
  document.getElementById("preview-a-content").textContent = "";
  document.getElementById("preview-b-content").textContent = "";
}

async function loadResults() {
  const response = await fetch("results.json");
  return await response.json();
}

function populateSelectOptions(parsers, selectA, selectB) {
  for (const [id, parser] of Object.entries(parsers)) {
    const option = new Option(parser.name, id);
    selectA.add(option.cloneNode(true));
    selectB.add(option);
  }
  selectB.selectedIndex = Math.min(1, selectB.options.length - 1);
}

function badge(result) {
  return result && result.value !== undefined ? result.value : "error";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPreview(testContent, result) {
  if (result && result.error) {
    const errorLines = result.error.split("\n").map(function(line) {
      return '<span class="preview-line error">' + escapeHtml(line) + '</span>';
    });
    return errorLines.join("\n");
  }

  const lines = testContent.replace(/\n$/, "").split("\n");
  const previewLines = lines.map(line => {
    if (result && result.value && line.includes(result.value)) {
      return '<span class="preview-line active">' + escapeHtml(line) + '</span>';
    }
    return '<span class="preview-line">' + escapeHtml(line) + '</span>';
  });

  return previewLines.join("\n");
}

function buildRows(results, idA, idB, showAll) {
  const rows = [];
  const resultsA = results.results[idA];
  const resultsB = results.results[idB];

  for (const test of Object.keys(results.tests)) {
    const resA = resultsA[test];
    const resB = resultsB[test];

    if (resA.error || resB.error) {
      if (showAll) {
        rows.push({ test, resA, resB, badgeA: badge(resA), badgeB: badge(resB) });
      }
      continue;
    }

    if (resA.value === resB.value) {
      if (showAll) {
        rows.push({ test, resA, resB, badgeA: badge(resA), badgeB: badge(resB) });
      }
      continue;
    }

    rows.push({ test, resA, resB, badgeA: badge(resA), badgeB: badge(resB) });
  }

  return rows;
}

function renderTestList(rows) {
  const tests = document.getElementById("tests");
  tests.disabled = false;
  tests.innerHTML = "";

  if (rows.length === 0) {
    tests.add(new Option("No matching tests.", ""));
    tests.disabled = true;
    tests.size = 2;
    return;
  }

  for (const row of rows) {
    tests.add(new Option(row.test, row.test));
  }

  tests.size = Math.max(rows.length, 2);
  tests.selectedIndex = 0;
}

function renderPreviews(results, selectA, selectB, selectTest) {
  const idA = selectA.value;
  const idB = selectB.value;
  const parserA = results.parsers[idA];
  const parserB = results.parsers[idB];
  const test = selectTest.value;

  document.getElementById("preview-a-title").textContent = parserA.name;
  document.getElementById("preview-b-title").textContent = parserB.name;
  document.getElementById("preview-a-content").innerHTML = formatPreview(results.tests[test], results.results[idA][test]);
  document.getElementById("preview-b-content").innerHTML = formatPreview(results.tests[test], results.results[idB][test]);
}

function renderResults(results, selectA, selectB, selectTest, showAll) {
  const idA = selectA.value;
  const idB = selectB.value;
  const parserA = results.parsers[idA];
  const parserB = results.parsers[idB];
  const rows = buildRows(results, idA, idB, showAll.checked);

  if (rows.length === 0) {
    renderTestList(rows);
    document.getElementById("preview-a-title").textContent = parserA.name;
    document.getElementById("preview-b-title").textContent = parserB.name;
    document.getElementById("preview-a-content").textContent = "";
    document.getElementById("preview-b-content").textContent = "";
    return;
  }

  renderTestList(rows);
  renderPreviews(results, selectA, selectB, selectTest);
}

async function init() {
  let results;
  try {
    results = await loadResults();
  } catch (error) {
    setMessage("Error loading results: " + error);
    return;
  }

  const selectA = document.getElementById("parser-a");
  const selectB = document.getElementById("parser-b");
  const showAll = document.getElementById("show-all");
  const selectTest = document.getElementById("tests");

  populateSelectOptions(results.parsers, selectA, selectB);

  for (const element of [selectA, selectB, showAll]) {
    element.addEventListener("change", function() {
      renderResults(results, selectA, selectB, selectTest, showAll);
    });
  }

  selectTest.addEventListener("change", function() {
    renderPreviews(results, selectA, selectB, selectTest);
  })

  renderResults(results, selectA, selectB, selectTest, showAll);
}

init();
