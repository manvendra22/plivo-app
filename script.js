let selected = []
let incomingData = [];
let outgoingData = [];

(function readDataOnLoad() {
  readIncomingTextFile()
  readOutcomingTextFile()
})()

function readIncomingTextFile() {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", "./data/plivo_incoming.csv", true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var csvData = new Array()
        var allText = rawFile.responseText;
        var jsonObject = allText.split(/\r?\n|\r/)
        for (var i = 0; i < jsonObject.length; i++) {
          csvData.push(jsonObject[i].split(','));
        }
        incomingData = csvData
      }
    }
  }
  rawFile.send(null);
};

function readOutcomingTextFile() {
  var rawFile = new XMLHttpRequest();
  rawFile.open("GET", "./data/plivo_outgoing.csv", true);
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        var csvData = new Array()
        var allText = rawFile.responseText;
        var jsonObject = allText.split(/\r?\n|\r/)
        for (var i = 0; i < jsonObject.length; i++) {
          csvData.push(jsonObject[i].split(','));
        }
        outgoingData = csvData
      }
    }
  }
  rawFile.send(null);
};

let map = AmCharts.makeChart("mapdiv", {
  type: "map",
  theme: "dark",
  projection: "mercator",
  panEventsEnabled: true,
  backgroundColor: "#ffffff",
  backgroundAlpha: 1,
  zoomControl: {
    zoomControlEnabled: false
  },
  dataProvider: {
    map: "worldHigh",
    getAreasFromMap: true,
  },
  areasSettings: {
    autoZoom: false,
    color: "#E8EAF1",
    colorSolid: "#2BB031",
    selectable: true,
    selectedColor: "#2BB031",
    outlineColor: "#ffffff",
    rollOverColor: "#BFE7C1",
    rollOverOutlineColor: "#BFE7C1"
  },
  zoomControl: {
    zoomControlEnabled: false,
    homeButtonEnabled: false
  },
  zoomOnDoubleClick: false,
  dragMap: false,
  listeners: [{
    event: "clickMapObject",
    method: function (e) {

      // Ignore any click not on area
      if (e.mapObject.objectType !== "MapArea")
        return;

      let area = e.mapObject;

      if (area.showAsSelected) {
        area.showAsSelected = false;
        deleteTag(area.id)
      } else {
        area.showAsSelected = true;
        addInList(area.title, area.id)
      }

      e.chart.returnInitialColor(area);
    }
  }]
});

function addInList(title, id) {
  selected.push({
    id,
    title
  })
  let element = document.createElement('span')
  element.innerHTML = title
  element.id = id
  element.classList.add('tag')
  element.onclick = handleEvent;

  document.getElementById("selected").appendChild(element)
}

function handleEvent(event) {
  deleteTag(event.target.id)
}

function deleteTag(id) {
  let element = document.getElementById(id);
  element.parentNode.removeChild(element);

  selected = selected.filter(value => value.id != element.id)

  for (let i = 0; i < map.dataProvider.areas.length; i++) {
    if (map.dataProvider.areas[i].showAsSelected && map.dataProvider.areas[i].id == element.id) {
      map.dataProvider.areas[i].showAsSelected = false
    }
  }

  map.validateData();
}

function getEstimate() {

  let incomingTotal = 0
  let outgoingTotal = 0

  selected.forEach(value => {
    let iData = incomingData.find(data => data.indexOf(value.id) !== -1)
    let oData = outgoingData.find(data => data.indexOf(value.id) !== -1)

    if (iData) {
      incomingTotal += Number(iData[9])
    }
    if (oData) {
      outgoingTotal += Number(oData[6])
    }
  })

  document.getElementById("send-value").innerHTML = `$ ${incomingTotal}`
  document.getElementById("receive-value").innerHTML = `$ ${outgoingTotal}`

  console.log(incomingTotal, outgoingTotal)
  console.log(selected)
  console.log(incomingData)
  console.log(outgoingData)
}