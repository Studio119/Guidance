/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-25 15:52:37 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-07 18:08:46
 */

/**
 * 选择两种排序中交叉最少的一种。
 * @param {Array<{[city: string]: number}>}             prevState   上一步的状态
 * @param {Array<{[city: string]: number}>}             currState   当前的状态
 * @param {{order: Array<number>; crossings: number;}}  order1      第一种方案及其交叉次数
 * @param {Array<number>}                               order2      第二种方案
 * @returns {{order: Array<number>; crossings: number;}}            更好的一种方案
 */
const better = (prevState, currState, order1, order2) => {
    /**
     * 地区及其先后排序位置的字典
     * @type {{[name: string]: [number, number]}}
     */
    let dict = {};
    // 记录每个地区两次排序的位置
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
    /** 方案二交叉次数 */
    let crossings = 0;
    /** 已经遍历过的地区 */
    let eached = {};
    for (const a in dict) {
        if (dict.hasOwnProperty(a)) {
            const aChange = dict[a];
            eached[a] = true;
            for (const b in dict) {
                if (dict.hasOwnProperty(b) && dict.hasOwnProperty(a) && !eached[b]) {
                    const bChange = dict[b];
                    if ((bChange[0] - aChange[0]) * (bChange[1] - aChange[1]) < 0) {
                        // 若两次排序中，地区 A 和地区 B 的相对类别排序(大小关系)发生改变，则记为相交一次 
                        crossings++;
                    }
                }
            }
        }
    }
    
    // 返回更好的一次方案及其交叉次数
    return !order1 || crossings < order1.crossings ? { order: order2, crossings: crossings } : order1;
}

/**
 * 进入决策
 * @param {Array<{name: string; label: number;}>}               prevState     上一次采用的状态
 * @param {Array<{name: string; label: number;}>}               currState     当前状态
 * @param {{order: Array<number>; crossings: number;} | null}   best          记录最好的一次决策
 * @param {Array<number>}                                       possibleOrder 当前备选的序号
 * @param {Array<number>}                                       order         已经选择的序号
 * @returns {{order: Array<number>; crossings: number;}}                      最好的一次方案
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
 * 根据上一次采用的状态对当前状态的各分组重排序，以减少路径交叉。
 * @param {Array<{name: string; label: number;}>}       paths       当前状态
 * @param {Array<{name: string; label: number;}>}       prevPaths   上一次采用的状态
 * @returns {Array<{name: string; label: number;}>}                 路径交叉数量最少的状态
 */
const adjustPaths = (paths, prevPaths) => {
    /**
     * 上一个状态各个类别对应的地区列表
     * @type {{[label: number]: Array<string>}}
     */
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
    /**
     * 上一个状态各个类别对应的地区列表
     * @type {Array<Array<string>>}
     */
    const prevList = Object.values(prevDict);
    /**
     * 当前状态各个类别对应的地区列表
     * @type {{[label: number]: Array<string>}}
     */
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
    /**
     * 当前状态各个类别对应的地区列表
     * @type {Array<Array<string>>}
     */
    const currList = Object.values(currDict);
    
    /** 未被选择的序号的集合 */
    let possibleOrder = [];
    for (let i = 0; i < currList.length; i++) {
        possibleOrder.push(i);
    }

    // 进入决策
    const { order: bestDecision } = decide(prevList, currList, null, possibleOrder, []);

    /**
     * 按照决策结果更新的状态
     * @type {Array<{name: string; label: number;}>}
     */
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

/**
 * 封装所有用于和产生于 flow chart 的属性和逻辑的对象
 */
const flowChart = {
    /** 加载？？图相关元素的 SVG 标签 */
    SVG: d3.select("#SVGflowChart"),
    /** ？？图对应 SVG 容器的实际宽度 */
    width: parseInt(d3.select("#SVGflowChart").attr("width")),
    /** ？？图对应 SVG 容器的实际高度 */
    height: parseInt(d3.select("#SVGflowChart").attr("height")),
    /** ？？图对应 SVG 容器的内部间隔 */
    padding: {
        top: 16, right: 20, bottom: 46, left: 20
    },
    /** ？？图的时间(水平方向)比例尺 */
    scaleX: null,
    /**
     * ？？图加载的数据
     * @type {{[year: number]: {[prov: string]: [number, number, number]}} | null}
     */
    state: null,
    /**
     * 完成元素渲染。
     * @private 内部逻辑
     */
    render: () => {
        /**
         * 按照时间记录的数据列表
         * @type {Array<{year: number; list: Array<{name: string; label: number;}>}>}
         */
        let timeList = [];

        // 添加白色背景
        flowChart.SVG.selectAll(".background")
                    .data([0])
                    .enter()
                    .append('rect')
                    .attr("class", "background")
                    .attr('x', 0)
                    .attr('y', flowChart.padding.top)
                    .attr('width', (flowChart.width - flowChart.padding.left - flowChart.padding.right) * 4)
                    .attr('height', flowChart.height - flowChart.padding.top - flowChart.padding.bottom)
                    .style('fill', 'white')
                    .style('stroke', "#101020")
                    .on("click", () => {
                        // 点击背景清空高亮的路径
                        flowChart.SVG.selectAll(".path")
                                    .style("opacity", 0.6)
                                    .style("stroke-width", '1px');
                    });

        // 解析每一年的数据，加入进列表中
        Object.entries(flowChart.state).forEach(entry => {
            /**
             * 此年的数据
             * @type {{year: number; list: Array<{name: string; label: number;}>;}}
             */
            let thisYear = {
                year: parseInt(entry[0]),
                list: []
            };
            /**
             * 此年每个地区的分类列表
             * @type {Array<{name: string; label: number;}>}
             */
            let list = Object.entries(entry[1]).map(e => {
                return {
                    name: PrvcnmDict[e[0]],
                    label: e[1][2]
                };
            });
            // 列表按类别标签排序
            thisYear.list = list.sort((a, b) => {
                return a.label - b.label;
            });
            timeList.push(thisYear);
        });

        /**
         * 以地区为索引的绘制数据
         * @type {{[name: string]: Array<{year: number; label: number; x: number; y: number; height: number;}>}}
         */
        let flows = {};

        /** 平滑部分的宽度 */
        const rectWidth = (flowChart.scaleX(1) - flowChart.scaleX(0)) * 0.2;

        /**
         * 每次迭代中，记录前一次实际使用的分类状态
         * @type {{name: string; label: number;} | null}
         */
        let prevOrder = null;

        timeList.forEach(item => {
            /** 对应年份每条线可分配的高度 */
            const rectHeight = (flowChart.height - flowChart.padding.top - flowChart.padding.bottom) / item.list.length;

            /** 决策产生的状态 */
            const list = prevOrder ? adjustPaths(item.list, prevOrder)
                                    : item.list.sort((a, b) => a.name.localeCompare(b.name));

            prevOrder = list;

            /**
             * 每一类标签含有的地区数量
             * @type {Array<number>}
             */
            let groups = [];

            list.sort((a, b) => {               // 将列表按类别排序
                return a.label - b.label;
            }).forEach((city, i) => {
                // 更新对应标签所含的地区数量
                if (groups[city.label]) {
                    groups[city.label]++;
                } else {
                    groups[city.label] = 1;
                }
                // 添加对于当前地区的一条数据信息
                if (flows.hasOwnProperty(city.name)) {
                    flows[city.name].push({
                        year: item.year,                                            // 数据对应年份
                        label: city.label,                                          // 所在的类别标签
                        x: flowChart.padding.left + flowChart.scaleX(item.year),    // x 坐标偏移量
                        y: flowChart.padding.top + (i + 0.25) * rectHeight,         // y 坐标偏移量
                        height: rectHeight * 0.3                                    // 图形竖直剖面的宽度
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

            /** 类别框 update 部分 */
            const groupRect = flowChart.SVG.selectAll(".group-" + item.year).data(groups);
            // 类别框 update 部分绘制逻辑
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
                    .on("mouseenter", (d, i) => {
                        let names = [];
                        flowChart.SVG.selectAll(".year" + item.year + "label" + i)
                                    .each(e => {
                                        names.push(e.name);
                                    });
                        /** 容器 DOM 的浏览器定位 */
                        const bounding = d3.select("#SVGflowChart").node().getBoundingClientRect();
                        tooltip.show()
                                .moveTo(
                                    bounding.x + (
                                        flowChart.padding.left + flowChart.scaleX(item.year)
                                            + parseInt(
                                                d3.select("#SVGflowChart").style("transform").replace("translate(", "")
                                            )
                                        > flowChart.width / 8 ? -160 : 40
                                    ) + (flowChart.padding.left + flowChart.scaleX(item.year)),
                                    bounding.y + 20
                                )
                                .html(
                                    item.year
                                    + (item.year === columnChart.currentYear ? (
                                        " <span style='color: #C06060; font-size: 13px;'>("
                                    ) : (
                                        " <span style='color: #808080; font-size: 12px;'>(不是"
                                    )) + "当前选择年份)</span><br />"
                                    + "类别成员(" + d + ")：<br />"
                                    + "<ul>"
                                    + names.map(name => ("<li>" + name + "</li>")).join("")
                                    + "</ul>"
                                );
                    })
                    .on("mouseleave", () => {
                        tooltip.hide();
                    })
                    .on('click', (d, i) => {
                        if (item.year !== columnChart.currentYear) {
                            // 同步年份
                            flyTo(item.year);
                        }
                        // 清除椭圆高亮
                        scatterChart.G.selectAll("ellipse")
                                    .style("stroke", "black")
                                    .style("stroke-width", "1px");
                        // 点击高亮所包含的地区的路径
                        flowChart.SVG.selectAll(".path")
                                    .style("opacity", 0.3)
                                    .style("stroke-width", '1px');
                        flowChart.SVG.selectAll(".year" + item.year + "label" + i)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    });
            // 类别框 enter 部分绘制逻辑
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
                    .on("mouseenter", (d, i) => {
                        let names = [];
                        flowChart.SVG.selectAll(".year" + item.year + "label" + i)
                                    .each(e => {
                                        names.push(e.name);
                                    });
                        /** 容器 DOM 的浏览器定位 */
                        const bounding = d3.select("#SVGflowChart").node().getBoundingClientRect();
                        tooltip.show()
                                .moveTo(
                                    bounding.x + (
                                        d3.event.clientX >= 700 ? -240 : 40
                                    ) + (flowChart.padding.left + flowChart.scaleX(item.year)),
                                    bounding.y + 20
                                )
                                .html(
                                    item.year
                                    + (item.year === columnChart.currentYear ? (
                                        " <span style='color: #C06060; font-size: 13px;'>(当前选择年份)</span><br />"
                                    ) : (
                                        " <span style='color: #808080; font-size: 12px;'>"
                                        + "(不是当前选择年份，单击跳转)</span><br />"
                                    ))
                                    + "类别成员(" + d + ")：<br />"
                                    + "<ul>"
                                    + names.map(name => ("<li>" + name + "</li>")).join("")
                                    + "</ul>"
                                );
                    })
                    .on("mouseleave", () => {
                        tooltip.hide();
                    })
                    .on('click', (d, i) => {
                        if (item.year !== columnChart.currentYear) {
                            // 同步年份
                            flyTo(item.year);
                        }
                        // 清除椭圆高亮
                        scatterChart.G.selectAll("ellipse")
                                    .style("stroke", "black")
                                    .style("stroke-width", "1px");
                        // 点击高亮所包含的地区的路径
                        flowChart.SVG.selectAll(".path")
                                    .style("opacity", 0.3)
                                    .style("stroke-width", '1px');
                        flowChart.SVG.selectAll(".year" + item.year + "label" + i)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    });
            // 类别框 exit 部分绘制逻辑
            groupRect.exit().remove();
        });

        /**
         * 地区对应数据的列表
         * @type {Array<{name: string;
         * coordinates: Array<{year: number; label: number; x: number; y: number; height: number;}>}>}
         */
        const cityFlows = Object.entries(flows).map(entry => {
            return {
                name: entry[0],
                coordinates: entry[1]
            };
        });

        /** 路径的 update 部分 */
        const paths = flowChart.SVG.selectAll(".path").data(cityFlows);
        // 路径 update 部分绘制逻辑
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
        // 路径 enter 部分绘制逻辑
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
        // 路径 exit 部分绘制逻辑
        paths.exit().remove();
    },
    /**
     * 初始化 flow chart 图数据。
     * @public 外部接口
     * @param {{[year: number]: {[prov: string]: [number, number, number]}}} state
     */
    initialize: state => {
        flowChart.state = state;
        flowChart.render();
    },
    /**
     * 平移元素容器。
     * @public 外部接口
     * @param {number} x 当前选定年份
     */
    transform: x => {
        flowChart.SVG.transition()
                    .duration(200)
                    .style("transform", "translateX(" + Math.round(flowChart.scaleX(x) * -3 / 4) + "px)");
    }
};
