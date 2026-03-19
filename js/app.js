function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  icon.className = theme === 'dark' ? 'fa fa-moon-o' : 'fa fa-sun-o';
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  if (isDark) {
    html.removeAttribute('data-theme');
    localStorage.setItem('glimpse-theme', 'light');
    updateThemeIcon('light');
  } else {
    html.setAttribute('data-theme', 'dark');
    localStorage.setItem('glimpse-theme', 'dark');
    updateThemeIcon('dark');
  }
  if (window.Glimpse && Glimpse.plot && Glimpse.plot.getThemeLayout) {
    Plotly.relayout('plot', Glimpse.plot.getThemeLayout());
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const savedTheme = localStorage.getItem('glimpse-theme') || 'dark';
  updateThemeIcon(savedTheme);
});

window.toggleTheme = toggleTheme;

(() => {
  const Glimpse = window.Glimpse || (window.Glimpse = {});
  Glimpse.state = {
    rows: {},
    header: [],
    fileName: null,
    lastRenderHadSignals: false,
    lastRenderHadTracesOnY1: false,
    lastRenderHadTracesOnY2: false
  };
  Glimpse.actions = Glimpse.actions || {};

  function handleDataLoaded(payload) {
    Glimpse.state.rows = payload.rows;
    Glimpse.state.header = payload.header;
    Glimpse.state.fileName = payload.fileName || null;

    Glimpse.ui.cleanUp();
    Glimpse.ui.addDropdown(payload.header);
    Glimpse.ui.addSignalSearchIfNeeded(payload.header.length);
    payload.header.forEach(Glimpse.ui.addCheckbox);

    if (Glimpse.data.isEcopiaHeader(payload.header)) {
      setEcopiaRec();
    }

    setExampleButtonVisible(false);
    plotDefaultSignals();
  }

  function plotDefaultSignals() {
    const rows = Glimpse.state.rows;
    const header = Glimpse.state.header;
    const xAxis = Glimpse.ui.getXAxisName();
    const preferred = ["OUTPUT", "ENCODERS_DIFF"];
    const available = preferred.filter(name => rows[name]);
    let signals = available;
    if (signals.length === 0) {
      signals = header.filter(name => name !== xAxis).slice(0, 2);
    }

    const traces = signals.map(name => Glimpse.plot.buildTrace(name, 0, rows, xAxis));
    const layout = Glimpse.plot.buildLayout(1, { roworder: 'bottom to top' });
    Glimpse.state.lastRenderHadSignals = traces.length > 0;
    Glimpse.state.lastRenderHadTracesOnY1 = traces.length > 0;
    Glimpse.state.lastRenderHadTracesOnY2 = false;
    Glimpse.plot.render(traces, layout);
  }

  function showExample() {
    const header = ["TIME", "Sine", "Cosine", "Random"];
    const rows = Glimpse.data.defineObj(header);
    rows["TIME"] = Plotly.d3.range(0.1, 10, 0.1);
    rows["Sine"] = rows["TIME"].map(x => Math.sin(x));
    rows["Cosine"] = rows["TIME"].map(x => Math.cos(x));
    rows["Random"] = rows["TIME"].map(x => Math.random());

    Glimpse.state.rows = rows;
    Glimpse.state.header = header;

    Glimpse.ui.cleanUp();
    Glimpse.ui.addDropdown(header);
    Glimpse.ui.addSignalSearchIfNeeded(header.length);
    header.forEach(Glimpse.ui.addCheckbox);

    const traces = [
      Glimpse.plot.buildTrace(header[1], 1, rows, "TIME"),
      Glimpse.plot.buildTrace(header[2], 1, rows, "TIME")
    ];
    const layout = Glimpse.plot.buildLayout(1, { roworder: 'bottom to top' });
    Glimpse.state.lastRenderHadSignals = true;
    Glimpse.state.lastRenderHadTracesOnY1 = true;
    Glimpse.state.lastRenderHadTracesOnY2 = false;
    Glimpse.plot.render(traces, layout);
    setExampleButtonVisible(false);
  }

  function setExampleButtonVisible(isVisible) {
    const button = document.getElementById("exampleDataButton");
    if (!button) {
      return;
    }
    button.style.display = isVisible ? "" : "none";
  }

  function selectSignals() {
    const checkedBoxes = Glimpse.ui.getCheckedBoxes("signalCheckbox");
    const checkedBoxes2 = Glimpse.ui.getCheckedBoxes("signalCheckbox2");
    const rows = Glimpse.state.rows;
    const xAxis = Glimpse.ui.getXAxisName();

    const traces = [];
    checkedBoxes.forEach(box => {
      traces.push(Glimpse.plot.buildTrace(box.id, 1, rows, xAxis));
    });
    checkedBoxes2.forEach(box => {
      traces.push(Glimpse.plot.buildTrace(box.id, 2, rows, xAxis));
    });

    const layout = Glimpse.plot.buildLayout(2);

    if (traces.length === 0) {
      // No signals selected — reset zoom to autorange
      layout.xaxis = { ...layout.xaxis, autorange: true };
      layout.yaxis = { ...layout.yaxis, autorange: true };
      layout.yaxis2 = { ...layout.yaxis2, autorange: true };
    } else {
      const gd = document.getElementById("plot");
      const hadY1 = Glimpse.state.lastRenderHadTracesOnY1;
      const hadY2 = Glimpse.state.lastRenderHadTracesOnY2;
      const hasY1 = checkedBoxes.length > 0;
      const hasY2 = checkedBoxes2.length > 0;

      // X-axis: preserve when we had any signals before
      if (Glimpse.state.lastRenderHadSignals && gd && gd.layout && gd.layout.xaxis && gd.layout.xaxis.range) {
        layout.xaxis = { ...layout.xaxis, range: gd.layout.xaxis.range };
      }

      // Y-axes: preserve only when that subplot had traces before; first signal in subplot → autorange
      if (hasY1 && hadY1 && gd && gd.layout && gd.layout.yaxis && gd.layout.yaxis.range) {
        layout.yaxis = { ...layout.yaxis, range: gd.layout.yaxis.range };
      } else if (hasY1) {
        layout.yaxis = { ...layout.yaxis, autorange: true };
      }
      if (hasY2 && hadY2 && gd && gd.layout && gd.layout.yaxis2 && gd.layout.yaxis2.range) {
        layout.yaxis2 = { ...layout.yaxis2, range: gd.layout.yaxis2.range };
      } else if (hasY2) {
        layout.yaxis2 = { ...layout.yaxis2, autorange: true };
      }
    }

    Glimpse.state.lastRenderHadSignals = traces.length > 0;
    Glimpse.state.lastRenderHadTracesOnY1 = checkedBoxes.length > 0;
    Glimpse.state.lastRenderHadTracesOnY2 = checkedBoxes2.length > 0;
    Glimpse.plot.render(traces, layout);
  }

  function setEcopiaRec() {
    const rows = Glimpse.state.rows;
    rows["Yaw"] = Glimpse.data.transforms.mult(rows["Yaw"], 0.01);
    rows["Pitch"] = Glimpse.data.transforms.mult(rows["Pitch"], 0.01);
    rows["Roll"] = Glimpse.data.transforms.mult(rows["Roll"], 0.01);
    rows["Yaw_angFix"] = Glimpse.data.transforms.fixAngle(rows["Yaw"]);
    Glimpse.ui.addCheckbox("Yaw_angFix");
  }

  function menuItemExecute(caller, action) {
    const rows = Glimpse.state.rows;
    switch (action) {
      case "Rename":
        renameVar(caller);
        break;
      case "Mult": {
        const factor = prompt(caller + " x ? ", 0.01);
        if (factor !== null) {
          const newVarName = Glimpse.data.strClean(caller + "_x_" + factor);
          rows[newVarName] = Glimpse.data.transforms.mult(rows[caller], factor);
          Glimpse.ui.addCheckbox(newVarName);
        }
        break;
      }
      case "Diff":
        rows[caller + "_diff"] = Glimpse.data.transforms.diff(rows[caller]);
        Glimpse.ui.addCheckbox(caller + "_diff");
        break;
      case "Integrate":
        rows[caller + "_int"] = Glimpse.data.transforms.integrate(rows[caller]);
        Glimpse.ui.addCheckbox(caller + "_int");
        break;
      case "filter": {
        const filterW = prompt("LPF Cutoff Frequency? [Hz] ", 5);
        if (filterW !== null) {
          rows[caller + "_filter"] = Glimpse.data.transforms.filter(rows[caller], filterW);
          Glimpse.ui.addCheckbox(caller + "_filter");
        }
        break;
      }
      case "Detrend":
        rows[caller + "_detrend"] = Glimpse.data.transforms.detrend(rows[caller]);
        Glimpse.ui.addCheckbox(caller + "_detrend");
        break;
      case "removeFirst":
        rows[caller + "_rem1"] = Glimpse.data.transforms.removeFirst(rows[caller]);
        Glimpse.ui.addCheckbox(caller + "_rem1");
        break;
      case "removeMean":
        rows[caller + "_remMean"] = Glimpse.data.transforms.removeMean(rows[caller]);
        Glimpse.ui.addCheckbox(caller + "_remMean");
        break;
      case "fixAngle":
        rows[caller + "_angFix"] = Glimpse.data.transforms.fixAngle(rows[caller]);
        Glimpse.ui.addCheckbox(caller + "_angFix");
        break;
      case "showStat":
        showStat();
        break;
      case "cutToZoom":
        cutToZoom();
        break;
      case "dataTips":
        markDataTips();
        break;
    }
  }

  function renameVar(oldName) {
    const newName = prompt("Please enter new variable name", oldName);
    if (newName != null && newName !== oldName) {
      const rows = Glimpse.state.rows;
      rows[newName] = rows[oldName];
      delete rows[oldName];
      const toChange = document.getElementById(oldName);
      if (toChange) {
        toChange.innerHTML = toChange.innerHTML.replaceAll(oldName, newName);
        toChange.onclick = selectSignals;
      }
    }
  }

  function showStat() {
    const gd = document.getElementById('plot');
    const xRange = gd.layout.xaxis.range;
    let yRange;
    try {
      yRange = gd.layout.yaxis.range;
    } catch {
      yRange = gd.layout.yaxis2.range;
    }
    const rows = Glimpse.state.rows;
    const xAxis = Glimpse.ui.getXAxisName();

    let xIdx = [];
    if (typeof rows[xAxis][2] === 'string') {
      xIdx[0] = rows[xAxis][Math.floor(xRange[0])];
      xIdx[1] = rows[xAxis][Math.floor(xRange[1])];
    } else {
      xIdx = xRange;
    }

    const stat = {
      Name: [],
      Mean: [],
      STD: [],
      Min: [],
      Max: []
    };

    gd.data.forEach(trace => {
      const len = Math.min(trace.x.length, trace.y.length);
      const xInside = [];
      const yInside = [];

      for (let i = 0; i < len; i++) {
        const x = trace.x[i];
        const y = trace.y[i];

        if (x > xIdx[0] && x < xIdx[1] && y > yRange[0] && y < yRange[1]) {
          xInside.push(x);
          yInside.push(y);
        }
      }
      stat.Name.push(trace.name);
      stat.Mean.push(Glimpse.data.stats.mean(yInside));
      stat.STD.push(Glimpse.data.stats.std(yInside));
      stat.Min.push(Math.min(...yInside));
      stat.Max.push(Math.max(...yInside));
    });

    alert(niceStr(stat));

    function niceStr(stat) {
      let str = '';
      for (let i = 0; i < stat.Mean.length; i++) {
        str += stat.Name[i] + ': \n';
        str += 'Min: ' + stat.Min[i].toFixed(3) + '\n';
        str += 'Max: ' + stat.Max[i].toFixed(3) + '\n';
        str += 'Mean: ' + stat.Mean[i].toFixed(3) + '\n';
        str += 'STD: ' + stat.STD[i].toFixed(3) + '\n\n';
      }
      return str;
    }
  }

  function cutToZoom() {
    const gd = document.getElementById('plot');
    const xRange = gd.layout.xaxis.range;
    const xAxis = Glimpse.ui.getXAxisName();
    const rows = Glimpse.state.rows;

    let idx = [];
    if (typeof rows[xAxis][2] !== 'string') {
      idx[0] = rows[xAxis].findIndex((val) => val > xRange[0]);
      idx[1] = rows[xAxis].findIndex((val) => val > xRange[1]);
    } else {
      idx = xRange;
    }

    const fields = Object.keys(rows);
    fields.forEach(field => {
      rows[field] = rows[field].slice(idx[0], idx[1]);
    });

    selectSignals();
  }

  function relativeTime() {
    const rows = Glimpse.state.rows;
    const Ts = prompt("Time Sample?", Glimpse.config.defaultSampleTime);
    Glimpse.state.rows = addTimeVectorToExistingObject(rows, Ts);
    Glimpse.ui.addCheckbox("Time");

    const selectElement = document.getElementById("x_axis");
    const newOption = document.createElement("option");
    newOption.value = "Time";
    newOption.text = "Time";
    if (selectElement) {
      selectElement.insertBefore(newOption, selectElement.firstChild);
    }

    function addTimeVectorToExistingObject(existingObject, sampleTime) {
      if (typeof existingObject !== 'object' || existingObject === null) {
        throw new Error('Invalid existing object. Please provide a valid object.');
      }
      const firstVectorKey = Object.keys(existingObject)[0];
      const vectorLength = existingObject[firstVectorKey].length;
      const timeVector = Array.from({ length: vectorLength }, (_, i) => i * sampleTime);
      return { Time: timeVector, ...existingObject };
    }
  }

  function markDataTips() {
    const fontSize = Glimpse.config.dataTipsFontSize ?? 12;
    const myPlot = document.getElementById("plot");
    myPlot.on("plotly_click", function (data) {
      for (let i = 0; i < data.points.length; i++) {
        const annotateText = "x = " + data.points[i].x +
          ", y = " + data.points[i].y.toPrecision(4);
        const annotation = {
          text: annotateText,
          x: data.points[i].x,
          y: parseFloat(data.points[i].y.toPrecision(4)),
          xref: data.points[0].xaxis._id,
          yref: data.points[0].yaxis._id,
          font: { size: fontSize }
        };
        const annotations = myPlot.layout.annotations || [];
        annotations.push(annotation);
        Plotly.relayout("plot", { annotations: annotations });
      }
    });
  }

  function setDataTipsFontSize() {
    const defaultSize = Glimpse.config.dataTipsFontSize ?? 12;
    const sizeInput = prompt("Data tips font size (px):", defaultSize);
    if (sizeInput == null || sizeInput === "") return;
    const fontSize = Math.max(8, Math.min(72, parseInt(sizeInput, 10) || defaultSize));
    Glimpse.config.dataTipsFontSize = fontSize;

    const gd = document.getElementById("plot");
    const annotations = gd?.layout?.annotations;
    if (annotations && annotations.length > 0) {
      const updated = annotations.map((a) => ({ ...a, font: { ...a.font, size: fontSize } }));
      Plotly.relayout("plot", { annotations: updated });
    }
  }

  function export2csv() {
    Glimpse.data.exportToCsv('download.csv', Glimpse.state.rows);
  }

  function addLabelsLine() {
    const labelsNavBar = document.getElementById("labelsNavBar");
    if (!labelsNavBar) {
      return;
    }

    if (labelsNavBar.style.display === "none") {
      labelsNavBar.style.display = 'flex';
      document.body.classList.add("labels-open");

      const signalLabels = localStorage["SignalLabels"];
      if (signalLabels !== undefined) {
        document.getElementById("labelsInput").value = signalLabels;
      }
      document.getElementById("labelsInput").addEventListener('input', updateValue);
    } else {
      labelsNavBar.style.display = 'none';
      document.body.classList.remove("labels-open");
    }

    function updateValue() {
      localStorage.setItem('SignalLabels', document.getElementById("labelsInput").value);
    }
  }

  function initSidenavResizer() {
    const resizer = document.getElementById("sidenav-resizer");
    if (!resizer) {
      return;
    }

    const root = document.documentElement;
    const minWidth = 200;
    const maxWidth = 520;

    function setWidths(width) {
      const clamped = Math.min(Math.max(width, minWidth), maxWidth);
      root.style.setProperty("--sidenav-width", `${clamped}px`);
      root.style.setProperty("--explenation-offset", `${clamped + 20}px`);
      root.style.setProperty("--plot-offset", `${Math.max(clamped - 20, 0)}px`);
    }

    resizer.addEventListener("mousedown", (event) => {
      event.preventDefault();
      document.body.classList.add("resizing");

      function onMouseMove(moveEvent) {
        setWidths(moveEvent.clientX);
      }

      function onMouseUp() {
        document.body.classList.remove("resizing");
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  }

  function initDropIndicator() {
    const indicator = document.querySelector(".drop-indicator");
    const fileSelector = document.getElementById("file-selector");
    if (!indicator || !fileSelector) {
      return;
    }

    indicator.addEventListener("click", () => {
      fileSelector.click();
    });
  }

  function init() {
    if (Glimpse.io && Glimpse.io.attachFileSelector) {
      Glimpse.io.attachFileSelector();
    }
    if (Glimpse.io && Glimpse.io.attachDragAndDrop) {
      Glimpse.io.attachDragAndDrop(["explenation_text", "plot"]);
    }
    setExampleButtonVisible(true);
    initSidenavResizer();
    initDropIndicator();
    initDataTipsContextMenu();
  }

  function initDataTipsContextMenu() {
    const btn = document.getElementById("dataTipsBtn");
    if (!btn) return;
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      setDataTipsFontSize();
    });
  }

  Glimpse.actions.handleDataLoaded = handleDataLoaded;
  Glimpse.actions.showExample = showExample;
  Glimpse.actions.selectSignals = selectSignals;
  Glimpse.actions.menuItemExecute = menuItemExecute;
  Glimpse.actions.renameVar = renameVar;
  Glimpse.actions.showStat = showStat;
  Glimpse.actions.cutToZoom = cutToZoom;
  Glimpse.actions.relativeTime = relativeTime;
  Glimpse.actions.markDataTips = markDataTips;
  Glimpse.actions.setDataTipsFontSize = setDataTipsFontSize;
  Glimpse.actions.export2csv = export2csv;
  Glimpse.actions.addLabelsLine = addLabelsLine;

  document.addEventListener('DOMContentLoaded', init);

  window.about = function () {
    Swal.fire({
      title: "Glimpse<br>Visualize your data",
      html: "For support, contact me:<br><br> Amihay Blau <br> mail: amihay@blaurobotics.co.il <br> Phone: +972-54-6668902",
      icon: "info"
    });
  };
})();
