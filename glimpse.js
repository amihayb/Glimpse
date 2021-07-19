// Glimpse

//const CSV =
//"D:/Documents/MATLAB/Robot/ControlTurn/turn2.csv";

function addLine(vName, ax, allRows) {
  let x = [];
  let y = [];

  var x_axis = document.getElementById("x_axis").value;
  x = rows[x_axis];
  y = rows[vName];
  var trace = {
    x: x,
    y: y,
    yaxis: 'y' + ax,
    name: vName,
    type: 'scatter',
  };
  return trace;
}
//plotFromCSV();

// Pass the checkbox name to the function
function getCheckedBoxes(chkboxName) {
  var checkboxes = document.getElementsByName(chkboxName);
  var checkboxesChecked = [];
  // loop over them all`
  for (var i = 0; i < checkboxes.length; i++) {
    // And stick the checked ones onto an array...
    if (checkboxes[i].checked) {
      checkboxesChecked.push(checkboxes[i]);
    }
  }
  // Return the array if it is non-empty, or null
  //return checkboxesChecked.length > 0 ? checkboxesChecked : null;
  return checkboxesChecked;
}


function addDropdown(values) {
  var select = document.createElement("select");
  select.name = "x_axis";
  select.id = "x_axis"

  for (const val of values) {
    var option = document.createElement("option");
    option.value = val;
    option.text = val.charAt(0).toUpperCase() + val.slice(1);
    select.appendChild(option);
  }

  var label = document.createElement("label");
  label.innerHTML = "X Axis: "
  label.htmlFor = "x_axis";

  document.getElementById("xaxis_dropdown").appendChild(label).appendChild(select);
}

const fileSelector = document.getElementById('file-selector');
fileSelector.addEventListener('change', (event) => {
  const fileList = event
    .target.files;
  console.log(fileList);
  for (const file of fileList) {
    readFile(file);
  }
});

function showExample() {
    let header = ["TIME", "Sine", "Cosine", "Random"];
    let startIdx =  0;
  rows = defineObj(header);
  rows["TIME"] = Plotly.d3.range(0.1, 10, 0.1);
  rows["Sine"] = rows["TIME"].map(x => Math.sin(x));
  rows["Cosine"] = rows["TIME"].map(x => Math.cos(x));
  rows["Random"] = rows["TIME"].map(x => Math.random());
  try {
    cleanUp();
  } catch (error) { };
  addDropdown(header);
  header.forEach(addCheckbox);

  var t1 = addLine(header[1], 0, rows);
  var t2 = addLine(header[2], 0, rows);
  data = [t1, t2];
  var layout = {
    grid: {
      rows: 1,
      columns: 1,
      pattern: 'coupled',
      roworder: 'bottom to top'
    }
  };

  Plotly.newPlot('plot', data, layout, { editable: true });
  window.rows = rows;
}

function readFile(file) {
  console.log(file);

  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    ttt = Plotly.d3.text(event.target.result, function (text) {
      resultlines = text.split(/\r?\n/);
      const { header, startIdx } = getHeader(resultlines);
      console.log(header);
      console.log(startIdx);

      //nums.push(resultlines.forEach(parseLine));	
      rows = defineObj(header);
      for (var i = startIdx; i < resultlines.length; i++) {
        var tLine = parseLine(resultlines[i]);
        //if (!isNaN(tLine[0])) {
        if (tLine.length == header.length) {
          for (var j = 0; j < header.length; j++) {
            rows[header[j]].push(tLine[j]);
          }
        }
      }
      try {
        cleanUp();
      } catch (error) { };
      addDropdown(header);
      header.forEach(addCheckbox);
      var t1 = addLine("OUTPUT", 1, rows);
      var t2 = addLine("ENCODERS_DIFF", 1, rows);
      data = [t1, t2];
      var layout = {
        grid: {
          rows: 2,
          columns: 1,
          pattern: 'coupled',
          roworder: 'bottom to top'
        }
      };

      Plotly.newPlot('plot', data, layout, { editable: true });

      //processData(rows);
      window.rows = rows;
      //return nums;
    });

    function parseLine(row) {
      //num = row.split(",").map(Number);
      num = row.split(",");
      //nums = row.split(",").filter(x => x.trim().length && !isNaN(x)).map(Number)
      //console.log(nums);
      return num;
    };

    function getHeader(resultlines) {

      headerObj = {
        header: ["TIME", "PITCH", "ROLL", "YAW", "YAW_CALIBRATION_OFFSET", "ACCEL_X", "ACCEL_Y", "ACCEL_Z", "PWM_LEFT", "PWM_RIGHT", "ENCODER_LEFT", "DIRECTION_LEFT", "ENCODER_RIGHT", "DIRECTION_RIGHT", "CURRENT_LEFT", "CURRENT_RIGHT", "CURRENT_MF", "CURRENT_MAGNET", "SENSOR_LEFT", "SENSOR_RIGHT", "BATTERY", "GAP_DETECT"],
        startIdx: 0
      }
      for (var i = 0; i < 50; i++) {
        var tLine = parseLine(resultlines[i]);
        if (tLine.length > 2 && isNaN(tLine[1])) {
          headerObj.header = verifyGoodName(tLine);
          headerObj.startIdx = i + 1;
          return headerObj;
        };
      };
      return headerObj;
    };
    //plotFromCSV(event.target.result);
  });
  reader.readAsDataURL(file);
}

function defineObj(header) {

  var obj = {};
  for (var i = 0; i < header.length; i++) {
    obj[header[i]] = [];
  };
  return obj;
};


function addCheckbox(colName) {
  var cont = document.createElement('container');
  cont.className = "container1";
  cont.id = colName;
  var checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.id = colName;
  checkbox.name = "signalCheckbox";
  checkbox.onclick = sel;

  var checkbox2 = document.createElement('input');
  checkbox2.type = "checkbox";
  checkbox2.id = colName;
  checkbox2.name = "signalCheckbox2";
  checkbox2.onclick = sel;

  //var span = document.createElement('span');
  //span.className="checkmark";
  var br = document.createElement('br');
  //var lbl = document.createTextNode(colName);
  br.onclick = "console.log(\"click\")";

  //var element = document.getElementById("sidenav");
  var element = document.getElementById("checkboxesPlace");
  element.appendChild(cont);
  cont.appendChild(checkbox);
  cont.appendChild(checkbox2);
  //cont.appendChild(span);
  cont.appendChild(document.createTextNode(colName));
  //cont.appendChild(lbl);
  cont.appendChild(br);

}

function verifyGoodName(name) {
  for (i = 0; i < name.length; i++) {
    if (name[i] === ' ') {
      name = name.slice(1, name.length);
    }
    return name;
  }

}

function sel() {
  var checkedBoxes = getCheckedBoxes("signalCheckbox");
  var checkedBoxes2 = getCheckedBoxes("signalCheckbox2");

  traces = [];
  let i = 0;
  while (i < checkedBoxes.length) {
    traces.push(addLine(checkedBoxes[i].id, 1, window.rows));
    i += 1;
  }

  i = 0;
  while (i < checkedBoxes2.length) {
    traces.push(addLine(checkedBoxes2[i].id, 2, window.rows));
    i += 1;
  }

  var layout = {
    height: window.innerHeight,
    grid: {
      rows: 2,
      columns: 1,
      pattern: 'coupled',
    }
  };

  //https://plot.ly/javascript/configuration-options/
  let config = {
    responsive: true,
    // staticPlot: true,
    // editable: true
  };

  Plotly.newPlot("plot", traces, layout, { editable: true });
}

function cleanUp() {
  var explenation_text = document.getElementById("explenation_text");
  explenation_text.style.display = "none";

  let containers = document.getElementsByClassName("container1");
  for (var i = containers.length - 1; i >= 0; i--) {
    containers[i].remove();
  };
  c = document.getElementById("xaxis_dropdown").children;
  c[0].remove();
}

function menuItemExecute(caller, action) {
  // console.log(caller + " " + action);
  switch (action) {
    case "Rename":
      renameVar(caller);
      break;

    case "Mult":
      var factor = prompt(caller + " x ? ", 0.01);
      if (factor !== null) {
        newVarName = strClean(caller + "_x_" + factor);
        window.rows[newVarName] = mult(window.rows[caller], factor);
        addCheckbox(newVarName);
      }
      break;

    case "Diff":
      window.rows[caller + "_diff"] = diff(window.rows[caller]);
      addCheckbox(caller + "_diff");
      break;

    case "Integrate":
      window.rows[caller + "_int"] = integrate(window.rows[caller]);
      addCheckbox(caller + "_int");
      break;

    case "Detrend":
      window.rows[caller + "_detrend"] = detrend(window.rows[caller]);
      addCheckbox(caller + "_detrend");
      break;

    case "removeFirst":
      window.rows[caller + "_rem1"] = removeFirst(window.rows[caller]);
      addCheckbox(caller + "_rem1");
      break;

    case "removeMean":
      window.rows[caller + "_remMean"] = removeMean(window.rows[caller]);
      addCheckbox(caller + "_remMean");
      break;

    case "fixAngle":
      window.rows[caller + "_angFix"] = fixAngle(window.rows[caller]);
      addCheckbox(caller + "_angFix");
      break;

    case "cutToZoom":
      cutToZoom();
      break;

  }
};

function renameVar(oldName) {
  var newName = prompt("Please enter new variable name", oldName);
  if (newName != null && newName !== oldName) {
    window.rows[newName] = window.rows[oldName];
    delete window.rows[oldName];
    toChange = document.getElementById(oldName);
    toChange.innerHTML = toChange.innerHTML.replaceAll(oldName, newName);
    toChange.onclick = sel;
  };
};

function cutToZoom() {
  var gd = document.getElementById('plot')
  var xRange = gd.layout.xaxis.range
  console.log(xRange);

  var idx = [];
  idx[0] = rows["TIME"].findIndex((val) => val > xRange[0]);
  idx[1] = rows["TIME"].length - rows["TIME"].reverse().findIndex((val) => val < xRange[1]);
  rows["TIME"].reverse();

  let fields = Object.keys(rows);

  fields.forEach(field => rows[field] = rows[field].slice(idx[0], idx[1]));

  sel();
}


////////////////////////////// Math Operations //////////////////////////////
function diff(y, x) {
  let Ts = 0.01;
  let d = [];
  for (i = 1; i < y.length; i++) {
    d[i] = (Number(y[i]) - Number(y[i - 1])) / Ts;
  }
  d[0] = d[1];
  return d;
}

function integrate(y, x) {
  let Ts = 0.01;
  let yInt = [];
  yInt[0] = parseFloat(y[0]);
  for (i = 1; i < y.length; i++) {
    yInt[i] = yInt[i - 1] + Ts * parseFloat(y[i]);
  }
  return yInt;
}

function detrend(y, x) {
  let a = (parseFloat(y[y.length - 1]) - parseFloat(y[0])) / (y.length - 1);
  let yd = y.map((item, i) => parseFloat(y[i]) - a * i);
  return yd;
}

function fixAngle(y, x) {
  let yo = [];
  let bias = 0;
  yo[0] = y[0];
  for (i = 1; i < y.length; i++) {
    bias += (y[i] - y[i - 1] > 300) ? -360 : 0;
    bias += (y[i] - y[i - 1] < -300) ? 360 : 0;
    yo[i] = y[i] + bias;
  }
  return yo;
}

let mult = (array, factor) => array.map(x => x * factor);

let removeFirst = (array) => array.map((item, idx, all) => parseFloat(item) - parseFloat(all[0]));

let removeMean = (array) => array.map((item, idx, all) => parseFloat(item) - mean(all));

let mean = (array) => array.reduce((a, b) => parseFloat(a) + parseFloat(b)) / array.length;

let strClean = (str) => str.replace(/[^a-zA-Z0-9 ]/g, "");

//var minIdx = (array, val) => array.findIndex(n => n > val);
//var maxIdx = (array, val) => array.findIndex(n => n > val);

    ////////////////////////// End of Math Operations ///////////////////////////
