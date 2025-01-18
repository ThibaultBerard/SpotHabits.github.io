// Manage the default tab and the tab switch
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');

let current_data = [];
let sub_data = [];
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
            createTimeline(data, current_year);

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

function createDonutChart(filteredData) {
  d3.select("#donut-chart").selectAll("*").remove();
  let [data, winningGenre] = getCountsAndWinningGenre(filteredData);

  const width = 400;
  const height = 400;
  const outerRadius = height / 2 - 10;
  const innerRadius = outerRadius * 0.75;

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const svg = d3
    .select("#donut-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const pie = d3
    .pie()
    .sort(null)
    .value((d) => d.value);

  const tooltip_donut = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip_donut")
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("font-size", "0.9rem");

  const donut = svg
    .selectAll("path")
    .data(pie(data))
    .join("path")
    .attr("fill", (d, i) => color(d.data.category))
    .attr("d", arc)
    .attr("opacity", 0);

  donut
    .transition()
    .duration(1500)
    .attr("opacity", 1)
    .attrTween("d", function (d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function (t) {
        return arc(i(t));
      };
    });

  donut
    .on("mouseover", function (event, d) {
      tooltip_donut
        .style("opacity", 1)
        .html(`<strong>${d.data.category}</strong><br>Count: ${d.data.value}`);
      d3.select(this).style("opacity", 0.7);
    })
    .on("mousemove", function (event) {
      tooltip_donut
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", function () {
      tooltip_donut.style("opacity", 0);
      d3.select(this).style("opacity", 1);
    });

  setTimeout(() => {
    svg
      .append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text(`Your Jam : ${winningGenre}`)
      .style("fill", "#6200ea")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .attr("opacity", 1);
  }, 1000);
}

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

function maxValue(data) {
  return Math.max(
    ...data.map((d) => Math.max(...d.values.map((v) => v.value)))
  );
}

function getPeriod(date, periods) {
  date = date.slice(5);

  for (const [key, ranges] of Object.entries(periods)) {
    for (const range of ranges) {
      const start = range.debut;
      const end = range.fin;

      if (date >= start && date <= end) {
        return key;
      }
    }
  }
  return "unknown";
}

function processStreamingData(data, periods, genreCounts) {
  data.forEach((entry) => {
    if (entry.genres && entry.ts) {
      const period = getPeriod(entry.ts, periods);
      if (period !== "unknown") {
        entry.genres.forEach((genre) => {
          if (!genreCounts[genre]) genreCounts[genre] = {};
          genreCounts[genre][period] = (genreCounts[genre][period] || 0) + 1;
        });
      }
    }
  });
}

function getTopGenres(genreCounts) {
  return Object.entries(genreCounts)
    .sort(
      (a, b) =>
        Object.values(b[1]).reduce((acc, v) => acc + v, 0) -
        Object.values(a[1]).reduce((acc, v) => acc + v, 0)
    )
    .slice(0, 5);
}

function generateSpiderData(topGenres, periods) {
  return topGenres.map(([genre, counts]) => ({
    genre,
    values: Object.keys(periods).map((key) => ({
      period: key,
      value: counts[key] || 0,
    })),
  }));
}

function calculatePercentageByPeriod(data) {
  const periods = data[0]?.values.map((item) => item.period) || [];

  const totalByPeriod = {};
  periods.forEach((period) => {
    totalByPeriod[period] = data.reduce((sum, genreData) => {
      const periodValue =
        genreData.values.find((item) => item.period === period)?.value || 0;
      return sum + periodValue;
    }, 0);
  });

  

  return data.map((genreData) => {
    const percentageValues = genreData.values.map((item) => {
      const totalForPeriod = totalByPeriod[item.period];
      const percentage = totalForPeriod
        ? ((item.value / totalForPeriod) * 100).toFixed(2)
        : 0;
      return {
        period: item.period,
        value: percentage,
      };
    });

    return {
      genre: genreData.genre,
      values: percentageValues,
    };
  });
}


function createSpiderChart(data, containerId) {
  const width = 500;
  const height = 400;
  const radius = Math.min(width, height) / 2;
  const levels = 5;

  const max = maxValue(data);


  const valMax = (Math.floor(max / 10) + 1) * 10;


  const svg = d3
    .select(containerId)
    .append("svg")
    .attr("width", width + 100)
    .attr("height", height + 100)
    .append("g")
    .attr(
      "transform",
      `translate(${(width + 100) / 2}, ${(height + 100) / 2})`
    );

  const angleSlice = (Math.PI * 2) / data[0].values.length;

  const radialScale = d3
    .scaleLinear()
    .domain([0, valMax]) // Domain for percentage
    .range([0, radius]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  // Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("padding", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Draw grid
  for (let level = 1; level <= levels; level++) {
    const levelFactor = (radius / levels) * level;
    const oui = (valMax / levels) * level;
    svg
      .append("circle")
      .attr("r", levelFactor)
      .attr("fill", "none")
      .attr("stroke", "#ccc");

    // Add grid labels
    svg
      .append("text")
      .attr("x", 5)
      .attr("y", -levelFactor)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .text(`${oui}%`);
  }

  // Draw axes and labels
  data[0].values.forEach((d, i) => {
    const angle = angleSlice * i;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    // Draw axes
    svg
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", x)
      .attr("y2", y)
      .attr("stroke", "#ccc");

    // Add labels
    const labelX = Math.cos(angle) * (radius + 40);
    const labelY = Math.sin(angle) * (radius + 20);
    svg
      .append("text")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "14px")
      .text(d.period);
  });

  // Draw areas and points
  data.forEach((d) => {
    const color = colorScale(d.genre);

    // Compute the path for the filled area
    const pathData = d.values
      .map((v, j) => {
        const angle = angleSlice * j;
        const x = Math.cos(angle) * radialScale(v.value);
        const y = Math.sin(angle) * radialScale(v.value);
        return [x, y];
      })
      .map((point) => point.join(","))
      .join(" L ");

    const closedPath = `M ${pathData} Z`;

    // Draw the filled area
    const path = svg
      .append("path")
      .attr("d", closedPath)
      .attr("fill", color)
      .attr("fill-opacity", 0.3)
      .attr("stroke", color)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", function () {
        return this.getTotalLength();
      })
      .attr("stroke-dashoffset", function () {
        return this.getTotalLength();
      })
      .on("mouseover", function () {
        d3.select(this).attr("fill-opacity", 0.6).attr("stroke-width", 3);
        tooltip.style("opacity", 1).html(`Style: ${d.genre}`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill-opacity", 0.3).attr("stroke-width", 2);
        tooltip.style("opacity", 0);
      });
    path
      .transition()
      .duration(1000)
      .ease(d3.easeCubic)
      .attr("stroke-dashoffset", 0);

    // Add points with tooltips
    d.values.forEach((v, j) => {
      const angle = angleSlice * j;
      const x = Math.cos(angle) * radialScale(v.value);
      const y = Math.sin(angle) * radialScale(v.value);

      svg
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 4)
        .attr("fill", color)
        .on("mouseover", function () {
          // Highlight point
          d3.select(this).attr("r", 6);

          // Show tooltip
          tooltip.style("opacity", 1).html(`Value: ${v.value}`);
        })
        .on("mousemove", function (event) {
          // Position tooltip near the cursor
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
          // Reset point style
          d3.select(this).attr("r", 4);

          // Hide tooltip
          tooltip.style("opacity", 0);
        });
    });
  });

  // Add legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${-width / 2 - 20}, ${-height / 2 - 20})`);

  data.forEach((d, i) => {
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", colorScale(d.genre));

    legendRow
      .append("text")
      .attr("x", 15)
      .attr("y", 10)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .text(d.genre);
  });
}

function loadSpiderChartForUser(userId, containerId, periods, dateRange) {
  console.log("Adding spider chart for user", userId, "in", containerId, "with date range", dateRange, "and periods", periods);
  const filePath = `Data/${userId}/Enriched_Streaming_History.json`;
  d3.json(filePath)
    .then((data) => {
      let selectedData;
      if (dateRange) {
        selectedData = data.filter(d => new Date(d.ts) >= dateRange[0] && new Date(d.ts) <= dateRange[1]);

      } else {
        selectedData = data.filter(d => new Date(d.ts).getFullYear() === current_year);
      }
      if (selectedData.length === 0) {
        selectedData = data;
      }

      const genreCounts = {};
      processStreamingData(selectedData, periods, genreCounts);

      const topGenres = getTopGenres(genreCounts);
      const spiderData = generateSpiderData(topGenres, periods);
      const percentageData = calculatePercentageByPeriod(spiderData);

      d3.select(containerId).selectAll("*").remove();
      createSpiderChart(percentageData, containerId);
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des données : ", error);
      alert("Impossible de charger les données pour cet utilisateur.");
    });
}

function initializeSpiderCharts(filteredData) {
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

// ------------- TIMELINE -------------

function createTimeline(data, year){
  const containerWidth = 1200;
  const svgWidth = containerWidth
  const height = 200;
  const axisHeight = 100;
  const barHeight = 50;
  const titleHeight = 40;
  const horizPadding = 30;
  
  
  const yearSelectorDiv = d3.select('#timeline_chart')
    .append('div')
    .attr('id', 'yearSelectorDiv')
  
  yearSelectorDiv.append('label')
    .attr('for', 'yearSelect')
    .text('Année : ')
  
  const yearSelector = yearSelectorDiv
    .append('select')
    .attr('id', 'yearSelect')
  
  const minYear = d3.min(data, (d)=>new Date(d.ts).getFullYear())
  const maxYear = d3.max(data, (d)=>new Date(d.ts).getFullYear())
  yearSelector.selectAll('option')
  .data(d3.range(maxYear, minYear-1, -1))
  .enter()
  .append('option')
  .attr('value', d => d)
  .text(d => d)

  yearSelector.property('value', year);

  // Create the SVG container
  const svg = d3.select('#timeline_chart')
    .append('svg')
    .attr('id', 'timeline')
    .attr('width', svgWidth)
    .attr('height', height+axisHeight);
  
  const filteredData = data.filter(d => new Date(d.ts).getFullYear() === year);

  const earliestDate = d3.min(filteredData, (d)=>new Date(d.ts));
  const latestDate = d3.max(filteredData, (d)=>new Date(d.ts));

  const timeScale = d3.scaleTime()
    .domain([earliestDate, latestDate])
    .nice()
    .range([horizPadding, svgWidth-horizPadding]);

    
    const title = svg.append('text')
    .attr('x', svgWidth/2)
    .attr('y', titleHeight)
    .attr('text-anchor', 'middle')
    .attr('font-size', '18px')
    .text(`Écoutes selon les périodes de l'année ${year}`)
  
  const axis = d3.axisBottom(timeScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat(d => capitalize(d.toLocaleString('fr-FR', { month: 'long' })));
    
    svg.append('g')
    .attr('transform', `translate(0, ${height+2})`)
    .call(axis);
  
  const legendGroup = svg.append('g')
    .attr('id', 'legendGroup')
    .attr('x', horizPadding)
    .attr('y', height+barHeight)
    
  d3.json("Data/periode.json")
    .then((loadedPeriods) => {

      const periods = loadedPeriods;
      const periodNames = Object.keys(periods);
      periodNames.push("unknown");

      const tooltip_timeline = d3.select('body')
        .append("div")
        .attr("id", "tooltip_timeline")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background", "rgba(0,0,0,0.7)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("font-size", "0.9rem");
      
      const colorScale = d3.scaleOrdinal()
        .domain(periodNames)
        .range(d3.schemeCategory10);

      const brush = d3.brushX()
        .extent([[horizPadding, height-barHeight*1.5], [svgWidth-horizPadding, height]])
        .on('end', brushed);

      const brushGroup = svg.append('g')
        .attr('class', 'brush')
        .call(brush);

      const legendXscale = d3.scaleBand()
        .domain(periodNames)
        .range([2*horizPadding, svgWidth-2*horizPadding]);
      
      legendGroup.selectAll('.legendPart')
        .data(periodNames)
        .enter()
        .append('g')
        .attr('class', 'legendPart')
        .attr('x', (d, i) => legendXscale(d))
        .each(function(d, i) {
          const legendPart = d3.select(this);
          legendPart.append('rect')
            .attr('x', legendXscale(d))
            .attr('y', height + barHeight)
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', colorScale(d));

          legendPart.append('text')
            .attr('x', legendXscale(d) + 15)
            .attr('y', height + barHeight + 10)
            .attr('text-anchor', 'start')
            .attr('font-size', '12px')
            .text(d);
        });


      // Create the timeline
      svg.append('g')
        .attr('class', 'timeline')
        .selectAll('rect')
        .data(filteredData)
        .enter()
        .append('rect')
        .attr('x', d => timeScale(new Date(d.ts)))
        .attr('y', height-barHeight)
        .attr('width', 2)
        .attr('height', barHeight)
        .attr('fill', d => colorScale(getPeriod(d.ts, periods)))
        .on('mouseover', function(event, d) {
          const date_str = new Date(d.ts).toLocaleDateString('fr-FR');
          const period = getPeriod(d.ts, periods);
          tooltip_timeline.html(`Date : ${date_str}<br>Période : ${period}`)
            .style('opacity', 1)
            .style('left', (event.pageX + 5) + 'px')
            .style('top', (event.pageY - 28) + 'px');
          d3.select(this).style("opacity", 0.7);
          
        })
        .on("mousemove", function (event) {
          tooltip_timeline
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
          tooltip_timeline.style("opacity", 0);
          d3.select(this).style("opacity", 1);
        });

        function updateTimeline(data, year_selected) {
          const filteredData = data.filter(d => new Date(d.ts).getFullYear() === year_selected);
        
          // Update the time scale's domain
          const earliestDate = d3.min(filteredData, d => new Date(d.ts));
          const latestDate = d3.max(filteredData, d => new Date(d.ts));
          timeScale.domain([earliestDate, latestDate]).nice();
        
          // Bind the new filtered data to the bars
          const bars = d3.select('#timeline').select('.timeline')
            .selectAll('rect')
            .data(filteredData);
        
          // Update bar positions
          bars.enter()
            .append('rect')
            .attr('y', height - barHeight)
            .attr('width', 2)
            .attr('height', barHeight)
            .attr('fill', d => colorScale(getPeriod(d.ts, periods)))
            .merge(bars)
            .transition()
            .duration(750)
            .attr('x', d => timeScale(new Date(d.ts)));
        
          // Remove any excess bars
          bars.exit().remove();
        
          // Update the axis
          const axis = d3.axisBottom(timeScale)
            .ticks(d3.timeMonth.every(1))
            .tickFormat(d => capitalize(d.toLocaleString('fr-FR', { month: 'long' })));
        
          d3.select('#timeline').select('g')
            .transition()
            .duration(750)
            .call(axis);
          
          // Update the title
          title.text(`Écoutes selon les périodes de l'année ${year_selected}`)
        }

        function brushed(event) {
          const selection = event.selection;
          if (selection) {
            const [start, end] = selection.map(timeScale.invert);
            console.log('Selected range:', start, end);

            sub_data = current_data.filter(d => new Date(d.ts) >= start && new Date(d.ts) <= end);
            update_viz(sub_data);
            initializeSpiderCharts([start, end]);

            // Pour afficher un label au dessus de la sélection
            const locale = 'fr-FR';
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const formattedStart = start.toLocaleString(locale, options);
            const formattedEnd = end.toLocaleString(locale, options);
            let label = formattedStart + ' — ' + formattedEnd;
            d3.select('#brushLabel').remove();
            svg.append('text')
              .attr('id', 'brushLabel')
              .attr('x', selection[0]+(selection[1]-selection[0])/2)
              .attr('y', height - barHeight*1.5 - 3)
              .attr('text-anchor', 'middle')
              .attr('font-size', '14px')
              .text(label);
          }
        }

        yearSelector.on('change', function() {
          current_year = +d3.select(this).property('value');
          d3.select('.brush').call(brush.move, null);
          d3.select('#brushLabel').remove();

          current_data = data.filter(d => new Date(d.ts).getFullYear() === current_year);
          sub_data = [];

          updateTimeline(current_data, current_year);
          update_viz(current_data);
          initializeSpiderCharts(undefined);
        });
    });
}

function update_viz(filteredData) {
  createBarChart(filteredData);
  createDonutChart(filteredData);
}

// ------------- BAR CHART -------------

// Constants for the bar chart
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const periods = ['Matin (< 12h)', 'Journée (12h-17h)', 'Soir (> 18h)'];
const barChartContainer = "#Bars"

/* Generates the necessary data for the bar chart,
meaning the number of listens per day of the week and per period of the day */
function getDataForBarChart(filteredData) {
    const dayCounts = {};

    days.forEach(day => dayCounts[day] = {});

    const hour_end_morning = 12;
    const hour_end_afternoon = 18;

    filteredData.forEach(d => {
      const date = new Date(d.ts);
      const day = date.getDay();
      const period = date.getHours() < hour_end_morning ? periods[0] : date.getHours() <= hour_end_afternoon ? periods[1] : periods[2];

      dayCounts[days[day]][period] = (dayCounts[days[day]][period] || 0) + 1;
    });

    const dayData = days.map(day => ({
      day,
      values: periods.map(period => ({
        period,
        value: dayCounts[day][period] || 0
      }))
    }));

    return dayData;
}

// Creates the bar chart
function createBarChart(data) {
  d3.select(barChartContainer).selectAll("*").remove(); // Empty the container

  let daysData = getDataForBarChart(data);

  const width = 900;
  const height = 500;
  const margin = { top: 50, right: 30, bottom: 40, left: 60 };

  const svg = d3.select(barChartContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#f5f5f5");

  const xScale = d3.scaleBand()
      .domain(daysData.map(d => d.day))
      .range([margin.top, height - margin.bottom])
      .padding(0.2);

  const yScale = d3.scaleLinear()
      .domain([0, d3.max(daysData, d => d3.sum(d.values, v => v.value))])
      .nice()
      .range([margin.left, width - margin.right]);

  // Fixed color mapping for each period
  const periodColors = {
    [periods[0]]: "#FFA07A",
    [periods[1]]: "#FFD700",
    [periods[2]]: "#87CEFA"
  };

  svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(yScale));

  svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(xScale));

  const barGroups = svg.selectAll(".bar-group")
      .data(daysData)
      .enter().append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(0,${xScale(d.day)})`);

  const bars = barGroups.selectAll("rect")
      .data(d => {
        let cumulative = 0;
        return d.values.map(v => {
          const start = cumulative;
          cumulative += v.value;
          return { ...v, start, cumulative };
        });
      });

  // Append bars
  bars.enter().append("rect")
      .attr("x", d => yScale(d.start))
      .attr("y", 0)
      .attr("height", xScale.bandwidth())
      .attr("width", d => yScale(d.cumulative) - yScale(d.start))
      .attr("fill", d => periodColors[d.period])
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

  // Adding a legend
  const legend = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top - 40})`);

  let legendX = width / 6;
  periods.forEach((period, i) => {
    const legendGroup = legend.append("g")
        .attr("transform", `translate(${legendX}, 0)`);

    legendGroup.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text(period)
        .style("font-size", "12px")
        .style("alignment-baseline", "middle");

    legendGroup.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", periodColors[period]);
    
    legendX += 200;
  });
}


function getCountsAndWinningGenre(data) {
  const genreCounts = {};

  data.forEach((entry) => {
    if (entry.genres) {
      entry.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });

  const filteredGenreCounts = Object.entries(genreCounts)
    .filter(([genre, count]) => count > 20)
    .map(([category, value]) => ({
      category,
      value,
    }));

  const winningGenre = Object.entries(genreCounts).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];

  return [filteredGenreCounts, winningGenre];
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}