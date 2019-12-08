var map = AmCharts.makeChart("mapdiv", {
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

      var area = e.mapObject;

      // Toggle showAsSelected
      // area.showAsSelected = !area.showAsSelected;
      area.showAsSelected = true;
      e.chart.returnInitialColor(area);

      // Update the list
      updateList(area.title, area.id)
    }
  }]
});

var selected = []

function updateList(title, id) {

  if (!selected.find(value => value.id === id)) {
    selected.push({
      id,
      title
    })
    var element = document.createElement('span')
    element.innerHTML = title
    element.id = id
    element.classList.add('tag')
    element.onclick = deleteTag;

    document.getElementById("selected").appendChild(element)
  }
}

function deleteTag(e) {
  var element = document.getElementById(e.target.id);
  element.parentNode.removeChild(element);

  // for (var i = 0; i < map.dataProvider.areas.length; i++) {
  //   if (map.dataProvider.areas[i].showAsSelected)
  //     selected.push(map.dataProvider.areas[i].id);
  // }

  console.log("MAP ", map)
}

// function getSelectedCountries() {
//   var selected = [];
//   for (var i = 0; i < map.dataProvider.areas.length; i++) {
//     if (map.dataProvider.areas[i].showAsSelected)
//       selected.push(map.dataProvider.areas[i].id);
//   }
//   return selected;
// }