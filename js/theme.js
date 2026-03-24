(() => {
  const STORAGE_KEY = "glimpse-theme";

  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(STORAGE_KEY, theme);
    updateIcon(theme);
    updateThemeColorMeta();
    refreshPlotTheme();
  }

  function updateThemeColorMeta() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.content = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-surface").trim() || "#ebf0f8";
  }

  function updateIcon(theme) {
    const icon = document.getElementById("theme-icon");
    if (!icon) return;
    icon.className = theme === "light" ? "fa fa-sun-o" : "fa fa-moon-o";
  }

  function refreshPlotTheme() {
    const plotEl = document.getElementById("plot");
    if (!plotEl || !plotEl.data || !plotEl.data.length) return;
    if (window.Glimpse && window.Glimpse.plot && window.Glimpse.plot.buildLayout) {
      const grid = plotEl.layout && plotEl.layout.grid;
      const rows = grid ? grid.rows : 1;
      const cols = grid ? grid.columns : 1;
      const newLayout = window.Glimpse.plot.buildLayout(rows, cols, {
        roworder: grid && grid.roworder ? grid.roworder : "bottom to top"
      });
      const update = {
        paper_bgcolor: newLayout.paper_bgcolor,
        plot_bgcolor: newLayout.plot_bgcolor,
        font: newLayout.font,
        legend: newLayout.legend
      };
      const subplotCount = rows * cols;
      const axisStyle = (axis) => ({
        gridcolor: axis.gridcolor,
        linecolor: axis.linecolor,
        zerolinecolor: axis.zerolinecolor,
        tickfont: axis.tickfont
      });
      for (let i = 1; i <= subplotCount; i++) {
        const xKey = "xaxis" + (i === 1 ? "" : i);
        const yKey = "yaxis" + (i === 1 ? "" : i);
        if (newLayout[xKey]) {
          Object.assign(update, Object.fromEntries(
            Object.entries(axisStyle(newLayout[xKey])).map(([k, v]) => [xKey + "." + k, v])
          ));
        }
        if (newLayout[yKey]) {
          Object.assign(update, Object.fromEntries(
            Object.entries(axisStyle(newLayout[yKey])).map(([k, v]) => [yKey + "." + k, v])
          ));
        }
      }
      Plotly.relayout("plot", update);
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  window.toggleTheme = toggleTheme;

  document.addEventListener("DOMContentLoaded", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    updateIcon(currentTheme);
    updateThemeColorMeta();

    const btn = document.getElementById("theme-toggle-btn");
    if (btn) {
      btn.addEventListener("click", toggleTheme);
    }
  });
})();
