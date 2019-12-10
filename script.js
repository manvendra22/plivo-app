let selected = []
let incomingData = [];
let outgoingData = [];
let sendCheckValue = false;
let receiveCheckValue = false;


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

  checkAndUpdateCTA()
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

  map.validateData()

  checkAndUpdateCTA()
}

function getEstimate() {

  let incomingTotal = 0
  let outgoingTotal = 0

  selected.forEach(value => {
    if (receiveCheckValue) {
      let iData = incomingData.filter(data => data.indexOf(value.title) !== -1)
      let count = 0;

      let iTotal = iData.reduce((total, current) => {
        if (Number(current[9])) {
          count++
          total = Number(current[9]) + total
        }
        return total
      }, 0)

      if (count) {
        iTotal = iTotal / count
        incomingTotal += iTotal
      }
    }
    if (sendCheckValue) {
      let oData = outgoingData.filter(data => data.indexOf(value.title) !== -1)
      let count = 0;

      let oTotal = oData.reduce((total, current) => {
        if (Number(current[6])) {
          count++
          total = Number(current[6]) + total
        }
        return total
      }, 0)

      if (count) {
        oTotal = oTotal / count
        outgoingTotal += oTotal
      }
    }
  })

  document.getElementById("send-value").innerHTML = `$ ${outgoingTotal.toFixed(2)}`
  document.getElementById("receive-value").innerHTML = `$ ${incomingTotal.toFixed(2)}`
}

var slider = new Slider('#message-count', {
  formatter: function (value) {
    if (value >= 2000) {
      handleContactSales()
    } else {
      handleViewPricing()
    }
    return 'Current value: ' + value;
  }
});

function setDummyData() {
  fetch('https://my.api.mockaroo.com/plivo.json?key=e66ba0c0')
    .then(response => response.json())
    .then(response => {
      let formElement = document.getElementById("contact-form")
      formElement.elements["first_name"].value = response.first_name
      formElement.elements["last_name"].value = response.last_name
      formElement.elements["work_email"].value = response.work_email
      formElement.elements["phone"].value = Number(response.phone)

      $('#form-container').collapse()
    })
}

function handleContactSales() {
  let sliderCTA = document.getElementById("slider-cta")

  sliderCTA.innerHTML = 'Contact Sales'
  sliderCTA.onclick = setDummyData
}

function handleViewPricing() {
  let sliderCTA = document.getElementById("slider-cta")

  sliderCTA.innerHTML = 'View Pricing'
  sliderCTA.onclick = function (e) {
    window.open('https://www.plivo.com/sms/pricing/us/', '_blank');
  }
}

function checkAndUpdateCTA() {
  let estimateCTA = document.getElementById('estimate-cta')

  if (selected.length && (sendCheckValue || receiveCheckValue)) {
    estimateCTA.disabled = false
  } else {
    estimateCTA.disabled = true
  }
}

let receiveCheck = document.getElementById('receiveCheck')
let sendCheck = document.getElementById('sendCheck')

receiveCheck.onclick = function () {
  receiveCheckValue = receiveCheck.checked
  checkAndUpdateCTA()
}

sendCheck.onclick = function () {
  sendCheckValue = sendCheck.checked
  checkAndUpdateCTA()
}

let formElem = document.getElementById("contact-form")

formElem.onsubmit = async (e) => {
  e.preventDefault();

  let response = await fetch('https://hooks.zapier.com/hooks/catch/6257988/o6qgzyj/', {
    method: 'POST',
    body: new FormData(formElem)
  });

  let result = await response.json();

  alert(result.status);
};