(() => {
  const Glimpse = window.Glimpse || (window.Glimpse = {});
  Glimpse.plot = Glimpse.plot || {};
  const plot = Glimpse.plot;

  const defaultConfig = {
    responsive: true,
    editable: true
  };

  function buildTrace(signalName, axisIndex, rows, xAxisName) {
    const x = rows[xAxisName] || [];
    const y = rows[signalName] || [];
    return {
      x,
      y,
      yaxis: 'y' + axisIndex,
      name: signalName,
      type: 'scatter'
    };
  }

  function buildLayout(rowCount, options) {
    const grid = {
      rows: rowCount,
      columns: 1,
      pattern: 'coupled'
    };
    if (options && options.roworder) {
      grid.roworder = options.roworder;
    }
    return {
      height: window.innerHeight - 80,
      grid
    };
  }

  function render(traces, layout, configOverride) {
    const config = { ...defaultConfig, ...(configOverride || {}) };
    Plotly.newPlot('plot', traces, layout, config);
  }

  plot.buildTrace = buildTrace;
  plot.buildLayout = buildLayout;
  plot.render = render;
})();
