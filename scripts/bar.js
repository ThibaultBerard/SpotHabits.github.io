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
export function createBarChart(data) {
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