import { getPeriod } from "./utils.js";
import { createDonutChart } from "./donut.js";
import { createBarChart } from "./bar.js";
import { initializeSpiderCharts } from './script.js';


let sub_data = [];
let current_year = 2024

export function createTimeline(data, year, current_data) {
  const containerWidth = 1200;
  const svgWidth = containerWidth;
  const height = 200;
  const axisHeight = 100;
  const barHeight = 50;
  const titleHeight = 40;
  const horizPadding = 30;

  const yearSelectorDiv = d3
    .select("#timeline_chart")
    .append("div")
    .attr("id", "yearSelectorDiv");

  yearSelectorDiv.append("label").attr("for", "yearSelect").text("Année : ");

  const yearSelector = yearSelectorDiv
    .append("select")
    .attr("id", "yearSelect");

  const minYear = d3.min(data, (d) => new Date(d.ts).getFullYear());
  const maxYear = d3.max(data, (d) => new Date(d.ts).getFullYear());
  yearSelector
    .selectAll("option")
    .data(d3.range(maxYear, minYear - 1, -1))
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => d);

  yearSelector.property("value", year);

  // Create the SVG container
  const svg = d3
    .select("#timeline_chart")
    .append("svg")
    .attr("id", "timeline")
    .attr("width", svgWidth)
    .attr("height", height + axisHeight);

  const filteredData = data.filter(
    (d) => new Date(d.ts).getFullYear() === year
  );

  const earliestDate = d3.min(filteredData, (d) => new Date(d.ts));
  const latestDate = d3.max(filteredData, (d) => new Date(d.ts));

  const timeScale = d3
    .scaleTime()
    .domain([earliestDate, latestDate])
    .nice()
    .range([horizPadding, svgWidth - horizPadding]);

  const title = svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", titleHeight)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .text(`Écoutes selon les périodes de l'année ${year}`);

  const axis = d3
    .axisBottom(timeScale)
    .ticks(d3.timeMonth.every(1))
    .tickFormat((d) =>
      capitalize(d.toLocaleString("fr-FR", { month: "long" }))
    );

  svg
    .append("g")
    .attr("transform", `translate(0, ${height + 2})`)
    .call(axis);

  const legendGroup = svg
    .append("g")
    .attr("id", "legendGroup")
    .attr("x", horizPadding)
    .attr("y", height + barHeight);

  d3.json("Data/periode.json").then((loadedPeriods) => {
    const periods = loadedPeriods;
    const periodNames = Object.keys(periods);
    periodNames.push("unknown");

    const tooltip_timeline = d3
      .select("body")
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

    const colorScale = d3
      .scaleOrdinal()
      .domain(periodNames)
      .range(d3.schemeCategory10);

    const brush = d3
      .brushX()
      .extent([
        [horizPadding, height - barHeight * 1.5],
        [svgWidth - horizPadding, height],
      ])
      .on("end", brushed);

    const brushGroup = svg.append("g").attr("class", "brush").call(brush);

    const legendXscale = d3
      .scaleBand()
      .domain(periodNames)
      .range([2 * horizPadding, svgWidth - 2 * horizPadding]);

    legendGroup
      .selectAll(".legendPart")
      .data(periodNames)
      .enter()
      .append("g")
      .attr("class", "legendPart")
      .attr("x", (d, i) => legendXscale(d))
      .each(function (d, i) {
        const legendPart = d3.select(this);
        legendPart
          .append("rect")
          .attr("x", legendXscale(d))
          .attr("y", height + barHeight)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", colorScale(d));

        legendPart
          .append("text")
          .attr("x", legendXscale(d) + 15)
          .attr("y", height + barHeight + 10)
          .attr("text-anchor", "start")
          .attr("font-size", "12px")
          .text(d);
      });

    // Create the timeline
    svg
      .append("g")
      .attr("class", "timeline")
      .selectAll("rect")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("x", (d) => timeScale(new Date(d.ts)))
      .attr("y", height - barHeight)
      .attr("width", 2)
      .attr("height", barHeight)
      .attr("fill", (d) => colorScale(getPeriod(d.ts, periods)))
      .on("mouseover", function (event, d) {
        const date_str = new Date(d.ts).toLocaleDateString("fr-FR");
        const period = getPeriod(d.ts, periods);
        tooltip_timeline
          .html(`Date : ${date_str}<br>Période : ${period}`)
          .style("opacity", 1)
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
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
      const filteredData = data.filter(
        (d) => new Date(d.ts).getFullYear() === year_selected
      );

      // Update the time scale's domain
      const earliestDate = d3.min(filteredData, (d) => new Date(d.ts));
      const latestDate = d3.max(filteredData, (d) => new Date(d.ts));
      timeScale.domain([earliestDate, latestDate]).nice();

      // Bind the new filtered data to the bars
      const bars = d3
        .select("#timeline")
        .select(".timeline")
        .selectAll("rect")
        .data(filteredData);

      // Update bar positions
      bars
        .enter()
        .append("rect")
        .attr("y", height - barHeight)
        .attr("width", 2)
        .attr("height", barHeight)
        .attr("fill", (d) => colorScale(getPeriod(d.ts, periods)))
        .merge(bars)
        .transition()
        .duration(750)
        .attr("x", (d) => timeScale(new Date(d.ts)));

      // Remove any excess bars
      bars.exit().remove();

      // Update the axis
      const axis = d3
        .axisBottom(timeScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat((d) =>
          capitalize(d.toLocaleString("fr-FR", { month: "long" }))
        );

      d3.select("#timeline").select("g").transition().duration(750).call(axis);

      // Update the title
      title.text(`Écoutes selon les périodes de l'année ${year_selected}`);
    }

    function brushed(event) {
      const selection = event.selection;
      if (selection) {
        const [start, end] = selection.map(timeScale.invert);
        console.log("Selected range:", start, end);

        sub_data = current_data.filter(
          (d) => new Date(d.ts) >= start && new Date(d.ts) <= end
        );
        update_viz(sub_data);
        initializeSpiderCharts([start, end]);

        // Pour afficher un label au dessus de la sélection
        const locale = "fr-FR";
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedStart = start.toLocaleString(locale, options);
        const formattedEnd = end.toLocaleString(locale, options);
        let label = formattedStart + " — " + formattedEnd;
        d3.select("#brushLabel").remove();
        svg
          .append("text")
          .attr("id", "brushLabel")
          .attr("x", selection[0] + (selection[1] - selection[0]) / 2)
          .attr("y", height - barHeight * 1.5 - 3)
          .attr("text-anchor", "middle")
          .attr("font-size", "14px")
          .text(label);
      }
    }

    yearSelector.on("change", function () {
      current_year = +d3.select(this).property("value");
      d3.select(".brush").call(brush.move, null);
      d3.select("#brushLabel").remove();

      current_data = data.filter(
        (d) => new Date(d.ts).getFullYear() === current_year
      );
      sub_data = [];

      updateTimeline(current_data, current_year);
      update_viz(current_data);
      initializeSpiderCharts(undefined);
    });
  });
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function update_viz(filteredData) {
  createBarChart(filteredData);
  createDonutChart(filteredData);
}
