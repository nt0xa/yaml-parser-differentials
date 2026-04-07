const $ = document.querySelector.bind(document);

class App {
  constructor() {
    this.selectA = $("#parser-a");
    this.selectB = $("#parser-b");
    this.checkboxShowAll = $("#show-all");
    this.selectTest = $("#tests");
    this.error = $("#error");
    this.previewATitle = $("#preview-a-title");
    this.previewBTitle = $("#preview-b-title");
    this.previewAContent = $("#preview-a-content");
    this.previewBContent = $("#preview-b-content");
    this.diffCount = $("#diff-count");

    this.handleRender = this.render.bind(this);
    this.handleRenderPreviews = this.renderPreviews.bind(this);
    this.data = null;
  }

  async start() {
    await this.loadData();
    if (!this.data) {
      return;
    }
    this.setupEventListeners();
    this.populateSelectOptions();
    this.render();
  }

  setupEventListeners() {
    for (const el of [this.selectA, this.selectB, this.checkboxShowAll]) {
      el.addEventListener("change", this.handleRender);
    }
    this.selectTest.addEventListener("change", this.handleRenderPreviews);
  }

  async loadData() {
    try {
      const response = await fetch("results.json");
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      this.data = await response.json();
    } catch (e) {
      this.setError(`Failed to load data: ${e.message}`);
    }
  }

  setError(message) {
    this.error.textContent = message;
  }

  populateSelectOptions() {
    for (const [id, parser] of Object.entries(this.data.parsers)) {
      const option = new Option(parser.name, id);
      this.selectA.add(option.cloneNode(true));
      this.selectB.add(option);
    }
    this.selectB.selectedIndex = Math.min(1, this.selectB.options.length - 1);
  }

  badge(result) {
    return result && result.value !== undefined ? result.value : "error";
  }

  getParser(id) {
    return this.data.parsers[id];
  }

  getResult(parserId, testId) {
    return this.data.results[parserId]?.[testId];
  }

  getSelectedTest() {
    return this.selectTest.options.length > 0 ? this.selectTest.value : null;
  }

  buildRows(idA, idB, showAll) {
    const rows = [];
    const resultsA = this.data.results[idA] || {};
    const resultsB = this.data.results[idB] || {};
    let diffCount = 0;

    for (const test of Object.keys(this.data.tests)) {
      const resA = resultsA[test];
      const resB = resultsB[test];
      const isDiff = resA && resB && !resA.error && !resB.error && resA.value !== resB.value;

      if (isDiff) {
        diffCount++;
      }

      if (isDiff || showAll) {
        rows.push({ test, resA, resB, badgeA: this.badge(resA), badgeB: this.badge(resB) });
      }
    }

    return { rows, diffCount };
  }

  render() {
    const { rows, diffCount } = this.buildRows(this.selectA.value, this.selectB.value, this.checkboxShowAll.checked);
    this.renderDiffCount(diffCount);
    this.renderTestList(rows);
    this.renderPreviews();
  }

  renderDiffCount(diffCount) {
    this.diffCount.textContent = `${diffCount} ${diffCount === 1 ? "difference" : "differences"}`;
  }

  renderTestList(rows) {
    this.selectTest.disabled = false;
    this.selectTest.innerHTML = "";

    if (rows.length === 0) {
      this.selectTest.disabled = true;
      this.selectTest.size = 2;
      return;
    }

    for (const row of rows) {
      this.selectTest.add(new Option(row.test, row.test));
    }

    this.selectTest.size = Math.max(rows.length, 2);
    this.selectTest.selectedIndex = 0;
  }

  renderPreviews() {
    const idA = this.selectA.value;
    const idB = this.selectB.value;
    const test = this.getSelectedTest();

    this.previewATitle.textContent = this.getParser(idA).name;
    this.previewBTitle.textContent = this.getParser(idB).name;

    if (!test) {
      this.previewAContent.textContent = "";
      this.previewBContent.textContent = "";
      return;
    }

    const testContent = this.data.tests[test];
    this.previewAContent.replaceChildren(this.formatPreview(testContent, this.getResult(idA, test)));
    this.previewBContent.replaceChildren(this.formatPreview(testContent, this.getResult(idB, test)));
  }

  formatPreview(testContent, result) {
    const container = document.createDocumentFragment();
    const hasError = Boolean(result?.error);
    const source = hasError ? result.error : testContent.replace(/\n$/, "");
    const lines = source.split("\n");

    lines.forEach(line => {
      const span = document.createElement("span");
      const isActive = !hasError && result?.value && line.includes(result.value);

      span.className = hasError
        ? "preview-line error"
        : isActive
          ? "preview-line active"
          : "preview-line";

      span.textContent = line;

      container.appendChild(span);
      container.appendChild(document.createTextNode("\n"));
    });

    return container;
  }
}

const app = new App();
app.start();
