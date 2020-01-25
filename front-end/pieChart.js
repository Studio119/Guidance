/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-12 21:33:09 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-23 20:42:38
 */
"use strict";

const pieChart = {
    SVG: d3.select("#SVGpieChart"),
    width: parseInt(d3.select("#SVGpieChart").attr("width")),
    height: parseInt(d3.select("#SVGpieChart").attr("height")),
    padding: {
        top: 60, right: 40, bottom: 40, left: 40
    },
    state: null,
    sum: 0,
    render: () => {
        // display name of the data
        const title = pieChart.SVG.selectAll(".title").data([pieChart.state]);
        title.text(d => {
            return d.name === "undefined" ? "" : d.name;
        });
        title.enter()
            .append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", pieChart.width / 2)
            .attr("y", pieChart.padding.top / 2)
            .text(d => {
                return d.name === "undefined" ? "" : d.name;
            });
        title.exit().remove();
        // Generate pie
        const arcs = d3.pie().sort((a, b) => a.name.localeCompare(b.name)).value(d => d.value)(pieChart.state.data);
        const r = Math.min(
            pieChart.width - pieChart.padding.left - pieChart.padding.right,
            pieChart.height - pieChart.padding.top - pieChart.padding.bottom
        ) / 2;
        const path = pieChart.SVG.selectAll(".arc").data(arcs);
        path.attr("d", d => d3.arc().innerRadius(0).outerRadius(r)(d));
        path.enter()
            .append("path")
            .attr("class", "arc")
            .attr("d", d => d3.arc().innerRadius(0).outerRadius(r)(d))
            .attr(
                "transform", "translate("
                                + (pieChart.padding.left + (
                                    pieChart.width - pieChart.padding.left - pieChart.padding.right) / 2
                                ) + ","
                                + (pieChart.padding.top + (
                                    pieChart.height - pieChart.padding.top - pieChart.padding.bottom) / 2
                                ) + ")"
            )
            .style("fill", (d, i) => d3.schemeCategory10[i % 10])
            .style("stroke", "none");
        path.exit().remove();

        const text = pieChart.SVG.selectAll(".pieText").data(arcs);
        text.attr("x", d => (Math.sin((d.startAngle + d.endAngle) / 2) * (r + 16)))
            .attr("y", d => (Math.cos((d.startAngle + d.endAngle) / 2) * (r + 16) * -1))
            .html(d => (
                d.data.name
                    + "<tspan"
                    + " x=" + (Math.sin((d.startAngle + d.endAngle) / 2) * (r + 16))
                    + " y=" + (Math.cos((d.startAngle + d.endAngle) / 2) * (r + 16) * -1 + 12)
                    + " style=\"fill: rgb(41,174,255); font-weight: bold;\""
                    + ">"
                        + Math.round(d.data.value / pieChart.sum * 100)
                    + "%</tspan>"
            ));
        text.enter()
            .append("text")
            .attr("class", "pieText")
            .attr(
                "transform", "translate("
                                + (pieChart.padding.left + (
                                    pieChart.width - pieChart.padding.left - pieChart.padding.right) / 2
                                ) + ","
                                + (pieChart.padding.top + (
                                    pieChart.height - pieChart.padding.top - pieChart.padding.bottom) / 2
                                ) + ")"
            )
            .attr("x", d => (Math.sin((d.startAngle + d.endAngle) / 2) * (r + 16)))
            .attr("y", d => (Math.cos((d.startAngle + d.endAngle) / 2) * (r + 16) * -1))
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .html(d => (
                d.data.name
                    + "<tspan"
                    + " x=" + (Math.sin((d.startAngle + d.endAngle) / 2) * (r + 16))
                    + " y=" + (Math.cos((d.startAngle + d.endAngle) / 2) * (r + 16) * -1 + 12)
                    + " style=\"fill: rgb(41,174,255); font-weight: bold;\""
                    + ">"
                        + Math.round(d.data.value / pieChart.sum * 100)
                    + "%</tspan>"
            ));
        text.exit().remove();
    },
    update: data => {
        pieChart.sum = 0;
        const pieces = Object.entries(data.details).map(item => {
            pieChart.sum += item[1];
            return {
                value: item[1],
                name: item[0]
            };
        });
        let allItems = [];
        let others = {
            value: 0,
            name: 'others'
        };
        let othersList = [];
        pieces.forEach(item => {
            const rate = item.value / pieChart.sum;
            if (rate < 0.03) {
                othersList.push(item.name);
                others.value += item.value;
            } else {
                allItems.push(item);
            }
        });
        if (others.value > 0) {
            if (othersList.length === 1) {
                allItems.push({
                    value: others.value,
                    name: othersList[0].name
                });
            } else {
                allItems.push(others);
            }
        }

        // Update its state and then render the SVG elements
        pieChart.state = {
            name: data.name,
            data: allItems
        };
        pieChart.render();
    }
};
