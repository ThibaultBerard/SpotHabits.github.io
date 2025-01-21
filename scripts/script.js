import { createTimeline, update_viz } from './timeline.js';
import { loadSpiderChartForUser } from './spider.js';

// Manage the default tab and the tab switch
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

let current_data = [];

let current_year = 2024

function activateTab(tabId) {
  tabs.forEach((t) => t.classList.remove('active'));
  contents.forEach((c) => c.classList.remove('active'));

  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  activateTab('tab1'); // Activer par défaut l'onglet "tab1"
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activateTab(tab.dataset.tab);
  });
});

let clickedCircles = [];

document.querySelectorAll(".circle").forEach((circle) => {
  circle.addEventListener("click", function () {
    clickedCircles.forEach((c) => c.classList.remove("selected1", "selected2"));

    let previous_amount = clickedCircles.length;

    if (!clickedCircles.includes(this)) {
      clickedCircles.push(this); // add new element
    }
    else {
      clickedCircles.splice(clickedCircles.indexOf(this), 1); // remove it if it's already in the array
    }

    if (clickedCircles.length > 2) {
      clickedCircles.pop(); // remove the last element if there are more than 2
    }

    if (clickedCircles[0]) clickedCircles[0].classList.add("selected1");
    if (clickedCircles[1]) clickedCircles[1].classList.add("selected2");

    let current_amount = clickedCircles.length;

    if (previous_amount === 0 && current_amount === 1) {
      const userId = this.id;
      const filePath = `Data/${userId}/Enriched_Streaming_History.json`;

      d3.json(filePath)
          .then(function (data) {
            const genreCounts = {};

            data.forEach((entry) => {
              if (entry.genres) {
                entry.genres.forEach((genre) => {
                  genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
              }
            });

            current_data = data.filter(d => new Date(d.ts).getFullYear() === current_year);

            d3.select("#timeline_chart").selectAll("*").remove();
            createTimeline(data, current_year, current_data);

            update_viz(current_data);
          })
          .catch((error) => {
            console.error("Erreur lors du chargement du fichier JSON : ", error);
            alert("Impossible de charger les données pour cet utilisateur.");
          });
    }
    else if (previous_amount !== 0 && current_amount === 0) {
        d3.select("#timeline_chart").selectAll("*").remove();
        d3.select("#donut-chart").selectAll("*").remove();
        d3.select("#Bars").selectAll("*").remove();
    }

    if (previous_amount !== current_amount) {
      initializeSpiderCharts(undefined);
    }
  });
});


// ------------- SPIDER CHARTS -------------

// Gestion du toggle
const toggle = document.getElementById("spider-toggle");
const toggleLabel = document.getElementById("toggle-label").querySelector("h2");


// Bascule du mode comparatif
toggle.addEventListener("change", () => {
  const section2 = document.getElementById('spider-chart2');
  if (toggle.checked) {
    toggleLabel.textContent = "Mode Comparaison activé";
    section2.classList.remove('hidden');
  } else {
    toggleLabel.textContent = "Mode Comparaison désactivé";
    section2.classList.add('hidden');
  }
});

export function initializeSpiderCharts(filteredData) {
  // Initialisation des Spider Charts
  d3.json("Data/periode.json").then((periods) => {
    // Charger les graphiques initiaux
    if (clickedCircles.length > 0) {
      let id_user1 = clickedCircles[0].id;
      loadSpiderChartForUser(id_user1, "#spider-chart-1", periods, filteredData);
    }
    if (clickedCircles.length > 1) {
      let id_user2 = clickedCircles[1].id;
      loadSpiderChartForUser(id_user2, "#spider-chart-2", periods, filteredData);
    }
  });
}


initializeSpiderCharts(undefined);

