/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-25 15:52:37 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-26 15:10:42
 */

/**
 * 选择两种排序中交叉最少的一种
 * @param {*} prevState     上一步的状态
 * @param {*} currState     当前的状态
 * @param {*} order1        第一种及其交叉次数
 * @param {*} order2        第二种
 */
const better = (prevState, currState, order1, order2) => {
    let dict = {};
    prevState.forEach((group, index) => {
        group.forEach(city => {
            dict[city] = [index];
        });
    });
    currState.forEach((group, index) => {
        group.forEach(city => {
            if (dict.hasOwnProperty(city)) {
                dict[city].push(order2[index]);
            }
        });
    });
    let crossings = 0;
    let eached = {};
    for (const a in dict) {
        if (dict.hasOwnProperty(a)) {
            const aChange = dict[a];
            eached[a] = true;
            for (const b in dict) {
                if (dict.hasOwnProperty(b) && dict.hasOwnProperty(a) && !eached[b]) {
                    const bChange = dict[b];
                    if ((bChange[0] - aChange[0]) * (bChange[1] - aChange[1]) < 0) {
                        crossings++;
                    }
                }
            }
        }
    }
    
    return !order1 || crossings < order1.crossings ? { order: order2, crossings: crossings } : order1;
}

/**
 * 进入决策
 * @param {*} prevState     上一步的状态
 * @param {*} currState     当前的状态
 * @param {*} best          记录最好的一次决策
 * @param {*} possibleOrder 当前备选的序号
 * @param {*} order         已经选择的序号
 */
const decide = (prevState, currState, best, possibleOrder, order) => {
    if (possibleOrder.length === 0) {
        // 排列已完成
        const bet = better(prevState, currState, best, order);
        return bet;
    }
    // 选取剩下中的一个
    for (let i = 0; i < possibleOrder.length; i++) {
        // 选择第 i 个
        order.push(possibleOrder[i]);
        // 将剩余的备选元素递归决策
        best = decide(
            prevState, currState, best, possibleOrder.filter((e, index) => i !== index), order.map(item => item)
        );
        // 取出本次迭代放入的元素，回溯
        order.pop();
    }
    return best;
}

/**
 * Reduce path crossings
 * @param {*} paths path list
 * @param {*} prevPaths previous path list
 */
const adjustPaths = (paths, prevPaths) => {
    // 储存上一个状态和当前状态的各个类别
    const prevDict = {};
    prevPaths.forEach(item => {
        if (prevDict.hasOwnProperty(item.label)) {
            prevDict[item.label].push(item.name);
        } else {
            prevDict[item.label] = [item.name];
        }
    });
    for (const key in prevDict) {
        if (prevDict.hasOwnProperty(key)) {
            const list = prevDict[key];
            prevDict[key] = list.sort((a, b) => a.localeCompare(b));    // 保证组内有序不交叉
        }
    }
    const prevList = Object.values(prevDict);
    let currDict = {};
    paths.forEach(item => {
        if (currDict.hasOwnProperty(item.label)) {
            currDict[item.label].push(item.name);
        } else {
            currDict[item.label] = [item.name];
        }
    });
    for (const key in currDict) {
        if (currDict.hasOwnProperty(key)) {
            const list = currDict[key];
            currDict[key] = list.sort((a, b) => a.localeCompare(b));    // 保证组内有序不交叉
        }
    }
    const currList = Object.values(currDict);
    
    let possibleOrder = [];     // 备选排序列表
    for (let i = 0; i < currList.length; i++) {
        possibleOrder.push(i);
    }

    // 进入决策
    const { order: bestDecision } = decide(prevList, currList, null, possibleOrder, []);

    let best = [];
    currList.forEach((group, index) => {
        group.forEach(item => {
            best.push({
                name: item,
                label: bestDecision[index]
            });
        });
    });

    return best;
};

const flowChart = {
    SVG: d3.select("#SVGflowChart"),
    width: parseInt(d3.select("#SVGflowChart").attr("width")),
    height: parseInt(d3.select("#SVGflowChart").attr("height")),
    padding: {
        top: 16, right: 20, bottom: 46, left: 20
    },
    scaleX: null,
    state: null,
    render: () => {
        let timeList = [];

        flowChart.SVG.selectAll(".background")
                    .data([0])
                    .enter()
                    .append('rect')
                    .attr("class", "background")
                    .attr('x', 0)
                    .attr('y', flowChart.padding.top)
                    .attr('width', (flowChart.width - flowChart.padding.left - flowChart.padding.right) * 4)
                    .attr('height', flowChart.height - flowChart.padding.top - flowChart.padding.bottom)
                    .style('fill', '#101020D0');

        Object.entries(flowChart.state).forEach(entry => {
            let thisYear = {
                year: parseInt(entry[0]),
                list: []
            };
            let list = Object.entries(entry[1]).map(e => {
                return {
                    name: PrvcnmDict[e[0]],
                    label: e[1][2]
                };
            });
            thisYear.list = list.sort((a, b) => {
                return a.label - b.label;
            });
            timeList.push(thisYear);
        });

        let flows = {};

        const rectWidth = (flowChart.scaleX(1) - flowChart.scaleX(0)) * 0.2;

        let prevOrder = null;

        timeList.forEach(item => {
            const rectHeight = (flowChart.height - flowChart.padding.top - flowChart.padding.bottom) / item.list.length;

            const list = prevOrder ? adjustPaths(item.list, prevOrder)
                                    : item.list.sort((a, b) => a.name.localeCompare(b.name));

            prevOrder = list;

            let groups = [];

            list.sort((a, b) => {
                return a.label - b.label;
            }).forEach((city, i) => {
                if (groups[city.label]) {
                    groups[city.label]++;
                } else {
                    groups[city.label] = 1;
                }
                if (flows.hasOwnProperty(city.name)) {
                    flows[city.name].push({
                        year: item.year,
                        label: city.label,
                        x: flowChart.padding.left + flowChart.scaleX(item.year),
                        y: flowChart.padding.top + (i + 0.25) * rectHeight,
                        height: rectHeight * 0.3
                    });
                } else {
                    flows[city.name] = [{
                        year: item.year,
                        label: city.label,
                        x: flowChart.padding.left + flowChart.scaleX(item.year),
                        y: flowChart.padding.top + (i + 0.25) * rectHeight,
                        height: rectHeight * 0.3
                    }];
                }
            });

            const groupRect = flowChart.SVG.selectAll(".group-" + item.year).data(groups);
            groupRect.attr('x', flowChart.padding.left + flowChart.scaleX(item.year))
                    .attr('y', (d, i) => {
                        let sum = 0;
                        for (let index = 0; index < i; index++) {
                            sum += groups[index];
                        }
                        return flowChart.padding.top + (sum - 0.1) * rectHeight;
                    })
                    .attr('class', "group-" + item.year)
                    .attr('width', rectWidth)
                    .attr('height', d => (rectHeight * d))
                    .style("fill", "white")
                    .style("stroke", "black")
                    .style("stroke-width", "2.6px")
                    .on('click', (d, i) => {
                        flowChart.SVG.selectAll(".path")
                                    .style("opacity", 0.6)
                                    .style("stroke-width", '1px');
                        flowChart.SVG.selectAll(".year" + item.year + "label" + i)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    });
            groupRect.enter()
                    .append('rect')
                    .attr('class', "group-" + item.year)
                    .attr('x', flowChart.padding.left + flowChart.scaleX(item.year))
                    .attr('y', (d, i) => {
                        let sum = 0;
                        for (let index = 0; index < i; index++) {
                            sum += groups[index];
                        }
                        return flowChart.padding.top + (sum - 0.1) * rectHeight;
                    })
                    .attr('rx', '2px')
                    .attr('ry', '2px')
                    .attr('width', rectWidth)
                    .attr('height', d => (rectHeight * d))
                    .style("fill", "white")
                    .style("stroke", "black")
                    .style("stroke-width", "2.6px")
                    .on('click', (d, i) => {
                        flowChart.SVG.selectAll(".path")
                                    .style("opacity", 0.6)
                                    .style("stroke-width", '1px');
                        flowChart.SVG.selectAll(".year" + item.year + "label" + i)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    });
            groupRect.exit().remove();
        });

        const cityFlows = Object.entries(flows).map(entry => {
            return {
                name: entry[0],
                coordinates: entry[1]
            };
        });

        const paths = flowChart.SVG.selectAll(".path").data(cityFlows);
        paths.attr("id", d => ("path_" + d.name))
            .attr("class", d => {
                return "path " + d.coordinates.map(c => ("year" + c.year + "label" + c.label)).join(" ");
            })
            .attr("d", d => {
                let path = "M" + d.coordinates[0].x + "," + d.coordinates[0].y
                            + " L" + (d.coordinates[0].x + rectWidth) + "," + d.coordinates[0].y;
                for (let i = 1; i < d.coordinates.length; i++) {
                    path += (
                        " L" + d.coordinates[i].x + "," + d.coordinates[i].y
                        + " L" + (d.coordinates[i].x + rectWidth) + "," + d.coordinates[i].y
                    );
                }
                for (let i = d.coordinates.length - 1; i >= 0; i--) {
                    path += (
                        " L" + (d.coordinates[i].x + rectWidth) + "," + (d.coordinates[i].y + d.coordinates[i].height)
                        + " L" + d.coordinates[i].x + "," + (d.coordinates[i].y + d.coordinates[i].height)
                    );
                }
                path += "Z";
                return path;
            })
            .style("fill", (d, i) => d3.schemePaired[i % 12])
            .style("opacity", (d, i) => {
                if (pieChart.state && d.name === pieChart.state.name) {
                    return 1;
                } else {
                    return 0.6;
                }
            })
            .style("stroke", (d, i) => d3.schemePaired[i % 12])
            .style("stroke-width", d => {
                if (pieChart.state && d.name === pieChart.state.name) {
                    return "4px";
                } else {
                    return "1px";
                }
            });
        paths.enter()
            .append("path")
            .attr("class", d => {
                return "path " + d.coordinates.map(c => ("year" + c.year + "label" + c.label)).join(" ");
            })
            .attr("id", d => ("path_" + d.name))
            .attr("d", d => {
                let path = "M" + d.coordinates[0].x + "," + d.coordinates[0].y
                            + " L" + (d.coordinates[0].x + rectWidth) + "," + d.coordinates[0].y;
                for (let i = 1; i < d.coordinates.length; i++) {
                    path += (
                        " L" + d.coordinates[i].x + "," + d.coordinates[i].y
                        + " L" + (d.coordinates[i].x + rectWidth) + "," + d.coordinates[i].y
                    );
                }
                for (let i = d.coordinates.length - 1; i >= 0; i--) {
                    path += (
                        " L" + (d.coordinates[i].x + rectWidth) + "," + (d.coordinates[i].y + d.coordinates[i].height)
                        + " L" + d.coordinates[i].x + "," + (d.coordinates[i].y + d.coordinates[i].height)
                    );
                }
                path += "Z";
                return path;
            })
            .style("fill", (d, i) => d3.schemePaired[i % 12])
            .style("opacity", (d, i) => {
                if (pieChart.state && d.name === pieChart.state.name) {
                    return 1;
                } else {
                    return 0.6;
                }
            })
            .style("stroke", (d, i) => d3.schemePaired[i % 12])
            .style("stroke-width", d => {
                if (pieChart.state && d.name === pieChart.state.name) {
                    return "4px";
                } else {
                    return "1px";
                }
            })
            .style("pointer-events", "none");
        paths.exit().remove();
    },
    initialize: state => {
        flowChart.state = state;
        flowChart.render();
    },
    transform: x => {
        flowChart.SVG.transition()
                    .duration(200)
                    .style("transform", "translateX(" + Math.round(flowChart.scaleX(x) * -3 / 4) + "px)");
    }
};
