/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-11 15:42:48 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-16 02:26:20
 */
"use strict";

/**
 * Load GDP data from local json file
 */
const loadData = () => {
    d3.json('./gdp.json')
        .then(res => {
            // Callback
            const data = convertData(res);
            columnChart.update(data);

            // Initialize the time slider
            initializeTimeSlider(Object.keys(data).sort((a, b) => (a - b)));
        }).catch(err => {
            console.info(err);
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
        if (Prvcnm === '中国') {
            // Skip items attributede to '中国'
            return;
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

// bind this listener on each checkbox
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

/**
 * Initialize the time slider
 * @param {*} timeTable
 */
const initializeTimeSlider = timeTable => {
    const padding = { top: 24, side: 20 };
    const timeScale = d3.scaleLinear()
                        .domain([timeTable[0], timeTable[timeTable.length - 1]])
                        .range([0, parseInt(d3.select("#timeSlider").attr("width")) - padding.side * 2]);
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
    g.selectAll("line").attr('transform', 'translate(0,-2.5)');
    const r = (timeScale(timeTable[1]) - timeScale(timeTable[0])) * 0.67;
    // draggable element
    const circle = d3.select("#timeSlider")
                    .append("circle")
                    .attr("id", "slideCircle")
                    .attr(
                        "transform", "translate("
                                        + (padding.side + 0.7) + ","
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
                                        + (padding.side + 0.7) + ","
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
                                        + (padding.side + 0.7) + ","
                                        + padding.top
                                    + ")"
                    )
                    .attr("text-anchor", "middle")
                    .attr("x", timeScale(timeTable[0]))
                    .attr("y", r * (-1.6))
                    .style("font-size", "11px")
                    .style("fill", "#000000")
                    .text(timeTable[0]);

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
                                columnChart.setYear(currentYear);
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
