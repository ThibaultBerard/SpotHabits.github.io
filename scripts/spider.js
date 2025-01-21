import { getPeriod } from './utils.js';


let current_year = 2024

function maxValue(data) {
    return Math.max(
      ...data.map((d) => Math.max(...d.values.map((v) => v.value)))
    );
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

function generateSpiderData(topGenres, periods) {
    return topGenres.map(([genre, counts]) => ({
      genre,
      values: Object.keys(periods).map((key) => ({
        period: key,
        value: counts[key] || 0,
      })),
    }));
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

export function loadSpiderChartForUser(userId, containerId, periods, dateRange) {
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