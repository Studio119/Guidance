/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-11 15:42:48 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-25 18:38:09
 */
"use strict";

/**
 * 用 id 索引名称
 */
var PrvcnmDict = {};

/**
 * Load GDP data from local json file
 */
const loadData = async () => {
    // Origin data
    await d3.json('./gdp.json')
            .then(res => {
                // Callback
                const data = convertData(res);
                columnChart.update(data);

                // Initialize the time slider
                initializeTimeSlider(Object.keys(data).sort((a, b) => (a - b)));
            }).catch(err => {
                console.warn(err);
            });
    // after MDS & k-means
    await d3.json("../back-end/output_file_k-means.json")
            .then(res => {
                // Callback
                scatterChart.initialize(res);
                flowChart.initialize(res);
            }).catch(err => {
                console.warn(err);
            });
};


/**
 * Convert GDP data into time-and-city-tagged objects
 * @param {*} list loaded list object
 */
const convertData = list => {
    let timeline = {};
    list.forEach(item => {
        // Seperate informations from each element
        const { Prvcnm, Prvcnm_id, Sgnyea, ...datum } = item;
        if (Prvcnm_id === 142) {
            // Skip items attributede to id 142
            return;
        } else {
            // Record the entry of Prvcnm_id and Prvcnm
            PrvcnmDict[Prvcnm_id] = Prvcnm;
        }
        if (!timeline.hasOwnProperty(Sgnyea)) {
            timeline[Sgnyea] = {};
        }
        // Fix empty records
        for (const key in datum) {
            if (datum.hasOwnProperty(key)) {
                const value = datum[key];
                if (value === "" || parseFloat(value) < 0) {
                    // if this is an empty record or an invalid record, replace it with 0
                    datum[key] = 0;
                }
            }
        }
        timeline[Sgnyea][Prvcnm] = datum;
    });

    return timeline;
};

/**
 * Changes the attribution filter
 * @param {*} name the name of the attribution changed
 */
const updateCheckbox = name => {
    const status = d3.select("#checkbox" + name)._groups[0][0].checked;
    if (columnChart.filter[name] === status) {
        return;
    }
    columnChart.filter[name] = status;
    columnChart.render();
};

/**
 * bind this listener on each checkbox
 */
(() => {
    const checkboxLabels = Object.keys(columnChart.filter);
    const checkboxContainer = d3.select("#checkboxContainer");

    var checkboxes = [];

    checkboxLabels.forEach((label, index) => {
        const input = checkboxContainer.append("input")
                        .attr("type", "checkbox")
                        .attr("id", "checkbox" + label)
                        .attr("checked", "checked")
                        .on('click', () => {
                            updateCheckbox(label);
                        });
        checkboxes.push(input);
        checkboxContainer.append("label").text(label).on('click', () => {
            // immitate clicking corresponding checkbox
            input._groups[0][0].checked = !input._groups[0][0].checked;
            input._groups[0][0].__on[0].listener();
        });
        if (index % 2 === 1 || index === checkboxLabels.length - 1) {
            checkboxContainer.append("br");
        }
    });

    checkboxContainer.append("button")
        .text("Select All")
        .style("margin-left", "14px")
        .on('click', () => {
        checkboxes.forEach(input => {
            input._groups[0][0].checked = true;
            input._groups[0][0].__on[0].listener();
        });
    });

    checkboxContainer.append("button")
        .text("Reverse")
        .style("margin-left", "17px")
        .on('click', () => {
        checkboxes.forEach(input => {
            input._groups[0][0].checked = !input._groups[0][0].checked;
            input._groups[0][0].__on[0].listener();
        });
    });
})();

/**
 * Initialize the time slider
 * @param {*} timeTable
 */
const initializeTimeSlider = timeTable => {
    const padding = { top: 24, side: 30 };
    const timeScale = d3.scaleLinear()
                        .domain([timeTable[0], timeTable[timeTable.length - 1]])
                        .range([0, parseInt(d3.select("#timeSlider").attr("width")) - padding.side * 2]);
    flowChart.scaleX = d3.scaleLinear()
                        .domain([timeTable[0], timeTable[timeTable.length - 1]])
                        .range([0, (parseInt(d3.select("#timeSlider").attr("width")) - padding.side * 2) * 4]);
    // scale and axis
    const g = d3.select("#timeSlider")
                .selectAll("g")
                .data([0])
                .enter()
                .append("g")
                .attr(
                    "transform", "translate("
                                    + padding.side + ","
                                    + padding.top
                                + ")"
                );
    const axis = d3.axisBottom(timeScale).ticks(timeTable.length);
    g.call(axis);
    g.selectAll("text").remove();
    g.selectAll("line").remove();
    const r = (timeScale(timeTable[1]) - timeScale(timeTable[0])) * 0.3;
    // draggable element
    const circle = d3.select("#timeSlider")
                    .append("circle")
                    .attr("id", "slideCircle")
                    .attr(
                        "transform", "translate("
                                        + padding.side + ","
                                        + padding.top
                                    + ")"
                    )
                    .attr("cx", timeScale(timeTable[0]))
                    .attr("cy", 0)
                    .attr("r", r + 0.5)
                    .style("fill", "none")
                    .style("stroke", "rgb(210,57,74)")
                    .style("stroke-width", "2px");
    // focus circle
    const focus = d3.select("#timeSlider")
                    .append("circle")
                    .attr("id", "slideCircleFocus")
                    .attr(
                        "transform", "translate("
                                        + padding.side + ","
                                        + padding.top
                                    + ")"
                    )
                    .attr("cx", timeScale(timeTable[0]))
                    .attr("cy", 0)
                    .attr("r", r)
                    .style("fill", "rgb(210,57,74)");
    // label
    const label = d3.select("#timeSlider")
                    .append("text")
                    .attr("id", "slideLabel")
                    .attr(
                        "transform", "translate("
                                        + padding.side + ","
                                        + padding.top
                                    + ")"
                    )
                    .attr("text-anchor", "middle")
                    .attr("x", timeScale(timeTable[0]))
                    .attr("y", r * (-1.6))
                    .style("font-size", "11px")
                    .style("fill", "#000000")
                    .text(timeTable[0]);
    
    const hightlight = d3.select("#timeSlider")
                    .append("rect")
                    .attr("id", "slideHighlight")
                    .attr("x", timeScale(timeTable[0]) - 30 + padding.side)
                    .attr("y", flowChart.padding.top - 294)
                    .attr("width", 60)
                    .attr("height", flowChart.height - flowChart.padding.top - flowChart.padding.bottom)
                    .style("transform", "translateX(0)")
                    .style("fill", "#101020");

    // Define a dragging behavior
    const behavior = d3.drag()
                        .on('start', () => {
                            focus.transition().duration(300).attr("r", r * 0.62);
                        })
                        .on('drag', () => {
                            const x = d3.event.x - padding.side;
                            const currentYear = Math.round(timeScale.invert(x));
                            if (currentYear < timeTable[0] || currentYear > timeTable[timeTable.length - 1]) {
                                return;
                            }
                            if (currentYear !== columnChart.currentYear) {
                                focus.attr("cx", timeScale(currentYear));
                                label.style("fill", "#A0A0A0").attr("x", timeScale(currentYear)).text(currentYear);
                                hightlight.style("transform", "translateX(" + timeScale(currentYear) + "px)");
                                columnChart.setYear(currentYear);
                                scatterChart.update(currentYear);
                                flowChart.transform(currentYear);
                            }
                        })
                        .on('end', () => {
                            focus.transition().duration(300).attr("r", r);
                            circle.transition().duration(300).attr("cx", timeScale(columnChart.currentYear));
                            label.transition().duration(300).style("fill", "#000000");
                        });
    focus.call(behavior);
};


// When this script is parsed, start to fetch data
loadData();
