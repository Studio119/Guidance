/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-11 15:42:51 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-25 21:39:44
 */
"use strict";

/**
 * Uses a constant object to deal with the column chart
 */
const columnChart = {
    SVG: d3.select("#SVGcolumnChart"),
    width: parseInt(d3.select("#SVGcolumnChart").attr("width")),
    height: parseInt(d3.select("#SVGcolumnChart").attr("height")),
    filter: {
        Gdp0101: true,  Gdp0102: true,  Gdp0103: true,  Gdp0104: true,  Gdp0105: true,  Gdp0106: true,
        Gdp0107: true,  Gdp0108: true,  Gdp0109: true,  Gdp0110: true,  Gdp0111: true,  Gdp0112: true,
        Gdp0113: true,  Gdp0114: true,  Gdp0115: true,  Gdp0116: true,  Gdp0126: true,  Gdp0127: true,
        Gdp0128: true,  Gdp0131: true
    },
    padding: {
        top: 24, right: 20, bottom: 40, left: 50
    },
    currentYear: NaN,
    activeProv: null,
    scaleY: null,
    state: null,
    render: () => {
        // Get corresponding data
        const origin = columnChart.state[columnChart.currentYear];
        let data = [];
        // Note the max number in order to set the y scale
        let max = 100;
        if (origin) {
            for (const prov in origin) {
                if (origin.hasOwnProperty(prov)) {
                    const gdp = origin[prov];
                    let value = 0;
                    let each = {};
                    // Add values of checked attributions up
                    for (const key in columnChart.filter) {
                        if (columnChart.filter.hasOwnProperty(key)) {
                            const checked = columnChart.filter[key];
                            if (checked) {
                                value += gdp[key];
                                each[key] = gdp[key];
                            }
                        }
                    }
                    data.push({
                        name: prov,
                        value: value,
                        details: each
                    });
                    if (value > max) {
                        max = value;
                    }
                }
            }
        }
        // Set width of columns and spans between each column
        const columnSpan = (columnChart.width - columnChart.padding.left - columnChart.padding.right) / data.length;
        const columnWidth = columnSpan * 0.6;
        // Update y scale
        columnChart.scaleY = d3.scaleLinear()
                                .domain([0, max * 1.1])     // Expand a bit to make a span
                                .range([columnChart.height - columnChart.padding.top - columnChart.padding.bottom, 0]);

        const g = columnChart.SVG.selectAll(".axes").data([0]); // Ensure there's only one pair of axes
        
        // Draw axes
        const yAxis = d3.axisLeft(columnChart.scaleY).ticks(5);
        g.call(yAxis);
        g.enter()
            .append("g")                                    // Append a g tag to lay the axes
            .attr("class", "axes")
            .attr("transform", "translate(" + columnChart.padding.left + "," + columnChart.padding.top + ")")
            .call(yAxis)                                    // Append y axis
            .append("line")                                 // Append x axis
            .attr("x1", 0)
            .attr("y1", columnChart.height - columnChart.padding.bottom - columnChart.padding.top)
            .attr("x2", columnChart.width - columnChart.padding.right - columnChart.padding.left)
            .attr("y2", columnChart.height - columnChart.padding.bottom - columnChart.padding.top)
            .style("stroke", "#808080");
        columnChart.SVG.select(".domain").attr("stroke", "#808080");
        
        // Draw columns
        const columns = columnChart.SVG.selectAll("rect").data(data);
        columns.attr("x", (d, i) =>
                    columnChart.padding.left + columnSpan * (i + 0.5) - columnWidth / 2
                )
                .attr("y", d =>
                    columnChart.padding.top + columnChart.scaleY(d.value)
                )
                .attr("width", columnWidth)
                .attr("height", d =>
                    columnChart.height - columnChart.padding.top - columnChart.padding.bottom
                        - columnChart.scaleY(d.value)
                )
                .attr("id", d => ("column_" + d.name))
                .style("fill", (d, i) => d3.schemePaired[i % 12])
                .style("fill-opacity", d => {
                    if (pieChart.state && d.name === pieChart.state.name) {
                        return 0.6;
                    } else {
                        return 1;
                    }
                })
                .style("stroke", d => {
                    if (pieChart.state && d.name === pieChart.state.name) {
                        return "red";
                    } else {
                        return "none";
                    }
                })
                .style("stroke-width", "3px")
                .on("click", d => {
                    // hightlight corresponding elements
                    columnChart.SVG.selectAll("rect")
                                    .style("stroke", "none")
                                    .style("fill-opacity", 1);
                    columnChart.SVG.select("#column_" + d.name)
                                    .style("fill-opacity", 0.5)
                                    .style("stroke", "red")
                                    .style("stroke-width", "3px");
                    scatterChart.SVG.selectAll("circle")
                                    .attr("r", "5px")
                                    .style("stroke-width", "0.5px");
                    scatterChart.SVG.select("#scatter_" + d.name)
                                    .attr("r", "8px")
                                    .style("stroke-width", "3px");
                    flowChart.SVG.selectAll(".path")
                                    .style("opacity", 0.6)
                                    .style("stroke-width", '1px');
                    flowChart.SVG.select("#path_" + d.name)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    // interaction
                    columnChart.onClick(d);
                });

        columns.enter()
                .append("rect")
                .attr("class", "column")
                .attr("id", d => ("column_" + d.name))
                .attr("x", (d, i) =>
                    columnChart.padding.left + columnSpan * (i + 0.5) - columnWidth / 2
                )
                .attr("y", d =>
                    columnChart.padding.top + columnChart.scaleY(d.value)
                )
                .attr("width", columnWidth)
                .attr("height", d =>
                    columnChart.height - columnChart.padding.top - columnChart.padding.bottom
                        - columnChart.scaleY(d.value)
                )
                .style("fill", (d, i) => d3.schemePaired[i % 12])
                .style("fill-opacity", d => {
                    if (pieChart.state && d.name === pieChart.state.name) {
                        return 0.5;
                    } else {
                        return 1;
                    }
                })
                .style("stroke", d => {
                    if (pieChart.state && d.name === pieChart.state.name) {
                        return "red";
                    } else {
                        return "none";
                    }
                })
                .style("stroke-width", "3px")
                .on("click", d => {
                    // hightlight corresponding elements
                    columnChart.SVG.selectAll("rect")
                                    .style("stroke", "none")
                                    .style("fill-opacity", 1);
                    columnChart.SVG.select("#column_" + d.name)
                                    .style("fill-opacity", 0.5)
                                    .style("stroke", "red")
                                    .style("stroke-width", "3px");
                    scatterChart.SVG.selectAll("circle")
                                    .attr("r", "5px")
                                    .style("stroke-width", "0.5px");
                    scatterChart.SVG.select("#scatter_" + d.name)
                                    .attr("r", "8px")
                                    .style("stroke-width", "3px");
                    flowChart.SVG.selectAll(".path")
                                    .style("opacity", 0.6)
                                    .style("stroke-width", '1px');
                    flowChart.SVG.select("#path_" + d.name)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    // interaction
                    columnChart.onClick(d);
                });
        
        columns.exit().remove();

        // Mark labels of names of provinces
        const labelProv = columnChart.SVG.selectAll(".labelProv").data(data);

        labelProv.attr("transform", (d, i) =>
                        ("translate("
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(0) + 4)
                    + "), rotate(270)")
                )
                .text(d => d.name.replace(/省|市|(维吾尔|回族|壮族)?自治区/, ""));

        labelProv.enter()
                .append("text")
                .attr("class", "labelProv")
                .attr("transform", (d, i) =>        // use translate instead of attributions x, y to prevent
                    ("translate("                   // the element from rotating around (0,0)
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(0) + 4)
                    + "), rotate(270)")
                )
                .attr("text-anchor", "end")        // use the right-end to locate the element
                .style("font-size", "10.5px")
                .text(d => d.name.replace(/省|市|(维吾尔|回族|壮族)?自治区/, ""));  // use regex to remove unnecessary letters

        labelProv.exit().remove();

        // Mark values of each column
        const labelValue = columnChart.SVG.selectAll(".labelValue").data(data);

        labelValue.attr("transform", (d, i) =>
                        ("translate("
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(d.value) - 4)
                    + "), rotate(270)")
                )
                .text(d => d.value.toString().split(".")[0]);

        labelValue.enter()
                .append("text")
                .attr("class", "labelValue")
                .attr("transform", (d, i) =>        // use translate instead of attributions x, y to prevent
                    ("translate("                   // the element from rotating around (0,0)
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(d.value) - 4)
                    + "), rotate(270)")
                )
                .attr("text-anchor", "begin")        // use the left-end to locate the element
                .style("font-size", "8px")
                .text(d => d.value.toString().split(".")[0]);  // use regex to remove unnecessary letters

        labelValue.exit().remove();

        if (columnChart.activeProv) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].name === columnChart.activeProv) {
                    columnChart.onClick(data[i]);
                    return;
                }
            }
        }
        columnChart.onClick({
            name: pieChart.state ? pieChart.state.name : 'undefined',
            value: 0,
            details: {}
        });
    },
    setYear: nextYear => {
        columnChart.currentYear = nextYear;
        columnChart.render();
    },
    update: nextState => {
        // Update its state and then render the SVG elements
        columnChart.state = nextState;
        if (isNaN(columnChart.currentYear)) {
            // Use the first record to initialize current year
            columnChart.currentYear = parseInt(Object.keys(nextState)[0]);
        }

        columnChart.render();
    },
    onClick: data => {
        columnChart.activeProv = data.name;
        pieChart.update(data);
    }
};
