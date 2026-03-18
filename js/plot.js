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

  function getThemeLayout() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const paperBg  = isDark ? '#0e1520' : '#ffffff';
    const plotBg   = isDark ? '#131d2e' : '#ffffff';
    const fontColor = isDark ? '#c8d8f0' : '#344563';
    const gridColor = isDark ? '#1e2d44' : '#e2e8f0';
    const lineColor = isDark ? '#1e2d44' : '#c9d4e0';

    const axisTheme = {
      color: fontColor,
      gridcolor: gridColor,
      linecolor: lineColor,
      tickcolor: lineColor,
      zerolinecolor: lineColor
    };

    return {
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      font: { color: fontColor },
      xaxis:  axisTheme,
      yaxis:  axisTheme,
      yaxis2: axisTheme,
      yaxis3: axisTheme,
      yaxis4: axisTheme,
      legend: { bgcolor: paperBg, font: { color: fontColor } }
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
      grid,
      ...getThemeLayout()
    };
  }

  function render(traces, layout, configOverride) {
    const config = { ...defaultConfig, ...(configOverride || {}) };
    Plotly.newPlot('plot', traces, layout, config);
  }

  plot.buildTrace = buildTrace;
  plot.buildLayout = buildLayout;
  plot.render = render;
  plot.getThemeLayout = getThemeLayout;
})();
