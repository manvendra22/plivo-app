let selected = []
let incomingData = [];
let outgoingData = [];
let sendCheckValue = false;
let receiveCheckValue = false;


(function readDataOnLoad() {
  readIncomingTextFile()
  readOutgoingTextFile()
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

function readOutgoingTextFile() {
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
  getEstimate()
}

function handleEvent(event) {
  deleteTag(event.target.id)
}

$('#contactsales-cta').click(function () { $('#form-container').collapse() })

$('#viewpricing-cta').click(function () {
  window.open('https://www.plivo.com/sms/pricing/us/', '_blank');
})

$('#receiveCheck').click(function () {
  receiveCheckValue = receiveCheck.checked
  checkAndUpdateCTA()
})

$('#sendCheck').click(function () {
  sendCheckValue = sendCheck.checked
  checkAndUpdateCTA()
})

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
  getEstimate()
}

function checkAndUpdateCTA() {
  let estimateCTA = $('#estimate-cta')

  if (selected.length && (sendCheckValue || receiveCheckValue)) {
    estimateCTA.attr('disabled', false)
  } else {
    estimateCTA.attr('disabled', true)
  }
}

let flag = true;

let slider = new Slider('#message-count', {
  formatter: function (value) {
    getEstimate(value)

    return 'Current value: ' + value;
  }
});

function getEstimate(volume = 1) {

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

  incomingTotal *= volume
  outgoingTotal *= volume

  document.getElementById("send-value").innerHTML = `$ ${outgoingTotal.toFixed(4)}`
  document.getElementById("receive-value").innerHTML = `$ ${incomingTotal.toFixed(4)}`

  if (selected.length && (sendCheckValue || receiveCheckValue)) {
    flag && $('#cost-container').collapse()
    flag = true
  }
}

$('#email').on('input', handleEmailInput)

function handleEmailInput(e) {
  if (e.target.validity.valid) {
    setDummyData(e.target.value)
  }
}

let formElem = $('#contact-form')

function setDummyData(email) {
  let url = `https://person.clearbit.com/v2/combined/find?email=${email}`
  let username = 'sk_826457d604bc69ecddc77cec1613afa7'
  let password = ''

  let header = new Headers()

  let encoded = window.btoa(`${username}:${password}`)
  let auth = `Basic ${encoded}`

  header.append('Authorization', auth)

  fetch(url, {
    method: 'GET',
    headers: header,
    credentials: 'same-origin'
  })
    .then(response => response.json())
    .then(response => {

      let person = response.person

      if (person) {
        formElem.elements["first_name"].value = person.name.givenName
        formElem.elements["last_name"].value = person.name.familyName
        formElem.elements["email"].value = person.email
      }
    })
}

formElem.submit(async (e) => {
  e.preventDefault();

  let response = await fetch('https://hooks.zapier.com/hooks/catch/6257988/o6qgzyj/', {
    method: 'POST',
    body: new FormData($(formElem))
  });

  let result = await response.json();

  alert(result.status);
})



