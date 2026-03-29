function setError(message) {
  let div = document.createElement("div");
  div.textContent = message;
  document.getElementById("content").replaceChildren(div);
}

async function loadResults() {
  let response = await fetch("results.json");
  return await response.json();
}

function populateSelectOptions(parsers, selectA, selectB) {
  for (const [id, parser] of Object.entries(parsers)) {
    const opt = new Option(parser.name, id);
    selectA.add(opt.cloneNode(true));
    selectB.add(opt);
  }
  selectB.selectedIndex = 1;
}

function badge(result) {
  return result?.value ?? "error";
}

function renderResults(results, selectA, selectB, showAll) {
  const idA = selectA.value;
  const idB = selectB.value;

  const parserA = results.parsers[idA];
  const parserB = results.parsers[idB];

  const resultsA = results.results[idA];
  const resultsB = results.results[idB];

  let rows = [];

  for (const test of Object.keys(results.tests)) {
    let resA = resultsA[test];
    let resB = resultsB[test];

    const row = { test, resA: badge(resA), resB: badge(resB) };

    if ("error" in resA || "error" in resB) {
      if (showAll.checked) {
        rows.push(row);
      }
      continue;
    }

    if (resA.value === resB.value) {
      if (showAll.checked) {
        rows.push(row);
      }
        continue;
    }

    rows.push(row);
  }

  console.log(rows);

  document.getElementById("content").innerHTML = `
<table>
  <thead>
    <tr>
      <th>Test</th>
      <th>${parserA.name}</th>
      <th>${parserB.name}</th>
    </tr>
  </thead>
  <tbody>
    ${rows.map(row => `<tr><td>${row.test}</td><td>${row.resA}</td><td>${row.resB}</td></tr>`).join("\n")}
  </tbody>
</table>`;
}

async function init() {
  let results;
  try {
    results = await loadResults();
  } catch (e) {
    setError("Error loading results: " + e);
    return;
  }

  const selectA = document.getElementById("parser-a");
  const selectB = document.getElementById("parser-b");
  const showAll = document.getElementById("show-all");

  for (const el of [selectA, selectB, showAll]) {
    el.addEventListener("change", () => renderResults(results, selectA, selectB, showAll));
  }

  populateSelectOptions(results.parsers, selectA, selectB);
  renderResults(results, selectA, selectB, showAll);
}

init();
