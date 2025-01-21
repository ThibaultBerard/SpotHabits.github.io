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

export function createDonutChart(filteredData) {
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