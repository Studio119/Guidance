/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-25 13:31:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-07 17:59:08
 */

/**
 * 根据类别与所对应的散点实际坐标的键值对生成椭圆列表。
 * @param {{[label: number]: Array<{x: number; y: number;}>}}                           dict    键值对
 * @returns {Array<{cx: number; cy: number; rx: number; ry: number; rotate: number}>}           椭圆参数列表
 */
const getEllipses = dict => {
    /**
     * 椭圆参数列表
     * @type {Array<{cx: number; cy: number; rx: number; ry: number; rotate: number}>}
     */
    let list = [];

    for (const label in dict) {
        if (dict.hasOwnProperty(label)) {
            const set = dict[label];
            if (set.length === 1) {
                // 仅有一个散点，以其为圆心取同心圆
                list.push({
                    cx: set[0].x,
                    cy: set[0].y,
                    rx: 12,
                    ry: 12,
                    rotate: 0
                });
            } else if (set.length === 2) {
                // 有两个散点，以其连线中点为圆心取椭圆
                const distance = Math.sqrt(Math.pow(set[0].x - set[1].x, 2) + Math.pow(set[0].y - set[1].y, 2));
                const degree = (set[1].y - set[0].y) * (set[1].x - set[0].x) >= 0
                                ? Math.acos(Math.abs(set[1].x - set[0].x) / distance) / Math.PI * 180
                                : -1 * Math.acos(Math.abs(set[1].x - set[0].x) / distance) / Math.PI * 180;
                list.push({
                    cx: (set[0].x + set[1].x) / 2,
                    cy: (set[0].y + set[1].y) / 2,
                    rx: distance * 0.5 + 16,
                    ry: 20,
                    rotate: degree
                });
            } else {
                // 有大于两个散点，先选取距离最远的一对点
                /** 最远的记录 */
                let maximum = {
                    a: 0, b: 0, dist: 0
                };
                // 遍历距离矩阵
                for (let a = 0; a < set.length - 1; a++) {
                    for (let b = a + 1; b < set.length; b++) {
                        /** 两点间的欧氏距离 */
                        const distance = Math.sqrt(Math.pow(set[b].x - set[a].x, 2) + Math.pow(set[b].y - set[a].y, 2));
                        if (distance > maximum.dist) {
                            maximum = {
                                a: a, b: b, dist: distance
                            };
                        }
                    }
                }
                // 确定这一对点为椭圆的两个焦点，计算最远的一个点的距离
                let max = 0;
                for (let i = 0; i < set.length; i++) {
                    if (i === maximum.a || i === maximum.b) {
                        continue;
                    } else {
                        /** 当前点与两焦点的欧氏距离之和 */
                        const distance = Math.sqrt(
                            Math.pow(set[i].x - set[maximum.a].x, 2) + Math.pow(set[i].y - set[maximum.a].y, 2)
                                        ) + Math.sqrt(
                            Math.pow(set[i].x - set[maximum.b].x, 2) + Math.pow(set[i].y - set[maximum.b].y, 2)
                                            );
                        if (distance > max) {
                            max = distance;
                        }
                    }
                }
                const degree = (set[maximum.b].y - set[maximum.a].y) * (set[maximum.b].x - set[maximum.a].x) >= 0
                                ? Math.acos(Math.abs(set[maximum.b].x - set[maximum.a].x) / max) / Math.PI * 180
                                : -1 * Math.acos(Math.abs(set[maximum.b].x - set[maximum.a].x) / max) / Math.PI * 180;
                list.push({
                    cx: (set[maximum.a].x + set[maximum.b].x) / 2,
                    cy: (set[maximum.a].y + set[maximum.b].y) / 2,
                    rx: maximum.dist * 0.5 + 16,
                    ry: Math.max(16, max * 0.4 + 16),
                    rotate: degree
                });
            }
        }
    }

    return list;
};

/**
 * 这个对象用于封装所有用于和产生于散点图的属性和逻辑
 */
const scatterChart = {
    /** 加载散点图相关元素的 SVG 标签 */
    SVG: d3.select("#SVGscatterChart"),
    /** 用于放置代表类别界线的大圆的集合 */
    G: d3.select("#SVGscatterChart").append("g").attr("id", "GscatterChart"),
    /** 散点图对应 SVG 容器的实际宽度 */
    width: parseInt(d3.select("#SVGscatterChart").attr("width")),
    /** 散点图对应 SVG 容器的实际高度 */
    height: parseInt(d3.select("#SVGscatterChart").attr("height")),
    /** 散点图对应 SVG 容器的内部间隔 */
    padding: {
        top: 50, right: 50, bottom: 50, left: 50
    },
    /**
     * 散点图加载的数据
     * @type {{[year: number]: {[prov: string]: [number, number, number]}} | null}
     */
    state: null,
    /** x 轴比例尺 */
    scaleX: null,
    /** y 轴比例尺 */
    scaleY: null,
    /**
     * 初始化散点图，加载数据，触发重绘。
     * @public 外部接口
     * @param {{[year: number]: {[prov: string]: [number, number, number]}}} state 导入的数据
     */
    initialize: state => {
        scatterChart.state = state;
        scatterChart.update(columnChart.currentYear);
    },
    /**
     * 渲染元素。
     * @private 内部逻辑
     * @param {{[prov: string]: [number, number, number]}} data 用于绘制的元素
     */
    render: data => {
        /** 值域，可绘制区域的二维距离较小值 */
        const range = Math.min(
            scatterChart.height - scatterChart.padding.top - scatterChart.padding.bottom,
            scatterChart.width - scatterChart.padding.left - scatterChart.padding.right
        );
        /** x 坐标的定义域 */
        let domainX = [-0.1, 0.1];
        /** y 坐标的定义域 */
        let domainY = [-0.1, 0.1];

        /**
         * 列表形式的散点数据
         * @type {Array<{id: number; coordinates: [number, number]; label: number;}>}
         */
        const dataList = Object.entries(data).map(entry => {     // 将对象转化为列表
            return {
                id: entry[0],
                coordinates: [entry[1][0], entry[1][1]],
                label: entry[1][2]
            };
        });

        // 遍历键值对，更新 x 和 y 坐标的最小最大值
        dataList.forEach(d => {
            domainX = [
                Math.min(domainX[0], d.coordinates[0]),
                Math.max(domainX[1], d.coordinates[0])
            ];
            domainY = [
                Math.min(domainY[0], d.coordinates[1]),
                Math.max(domainY[1], d.coordinates[1])
            ];
        });

        /** x 坐标定义域的极差 */
        const distanceX = domainX[1] - domainX[0];
        /** y 坐标定义域的极差 */
        const distanceY = domainY[1] - domainY[0];
        // 这里为保证两个坐标的缩放比例相等，取两组中长度最大的一组，另一组对其统一长度并居中
        if (distanceX >= distanceY) {
            domainY = [
                domainY[0] - (distanceX - distanceY) / 2,
                domainY[1] + (distanceX - distanceY) / 2
            ];
        } else {
            domainX = [
                domainX[0] - (distanceY - distanceX) / 2,
                domainX[1] + (distanceY - distanceX) / 2
            ];
        }

        // 更新两个比例尺
        scatterChart.scaleX = d3.scaleLinear()
                                .domain(domainX)
                                .range([0, range]);

        scatterChart.scaleY = d3.scaleLinear()
                                .domain(domainY)
                                .range([range, 0]);

        /**
         * 各个标签所含的散点坐标列表
         * @type {{[label: number]: Array<{x: number; y: number;}>}}
         */
        let eachLabel = {};

        dataList.forEach(item => {
            if (eachLabel.hasOwnProperty(item.label)) {
                eachLabel[item.label].push({
                    x: scatterChart.padding.left + scatterChart.scaleX(item.coordinates[0]),
                    y: scatterChart.padding.top + scatterChart.scaleY(item.coordinates[1])
                });
            } else {
                eachLabel[item.label] = [{
                    x: scatterChart.padding.left + scatterChart.scaleX(item.coordinates[0]),
                    y: scatterChart.padding.top + scatterChart.scaleY(item.coordinates[1])
                }];
            }
        });

        /** 所有类别对应的边框 */
        const sets = getEllipses(eachLabel);
        // 绘制椭圆
        /** 椭圆 update 部分 */
        const ellipses = scatterChart.G.selectAll("ellipse").data(sets);
        // 椭圆 update 部分绘制逻辑
        ellipses.attr('transform', d => {
                    return "translate(" + d.cx + "," + d.cy + "),rotate(" + d.rotate + ")";
                })
                .attr("id", (d, i) => ("group_" + i))
                .attr('rx', d => d.rx)
                .attr('ry', d => d.ry)
                .style("fill", (d, i) => d3.schemePaired[i])
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .on("click", (d, i) => {
                    // 高亮自身
                    scatterChart.G.selectAll("ellipse")
                                .style("stroke", "black")
                                .style("stroke-width", "1px");
                    scatterChart.G.select("#group_" + i)
                                .style("stroke", d3.schemePaired[i])
                                .style("stroke-width", "3px");
                    // 点击高亮所包含的地区的路径
                    flowChart.SVG.selectAll(".path")
                                .style("opacity", 0.3)
                                .style("stroke-width", '1px');
                    dataList.forEach(item => {
                        if (item.label === i) {
                            flowChart.SVG.select("#path_" + PrvcnmDict[item.id])
                                        .style("opacity", 1)
                                        .style("stroke-width", "4px");
                        }
                    });
                })
                .on("mouseenter", (d, i) => {
                    /** 对应的地区名称 */
                    let names = [];
                    dataList.forEach(item => {
                        if (item.label === i) {
                            names.push(PrvcnmDict[item.id]);
                        }
                    });
                    /** 散点图容器 DOM 的浏览器定位 */
                    const bounding = d3.select("#SVGscatterChart").node().getBoundingClientRect();
                    tooltip.show()
                            .moveTo(bounding.x + d.cx + Math.max(d.rx, d.ry) + 10, bounding.y + d.cy)
                            .html(names.join("<br />"));
                })
                .on("mouseleave", () => {
                    tooltip.hide();
                });
        // 椭圆 enter 部分绘制逻辑
        ellipses.enter()
                .append('ellipse')
                .attr("id", (d, i) => ("group_" + i))
                .attr('transform', d => {
                    return "translate(" + d.cx + "," + d.cy + "),rotate(" + d.rotate + ")";
                })
                .attr('rx', d => d.rx)
                .attr('ry', d => d.ry)
                .style("fill", (d, i) => d3.schemePaired[i])
                .style("fill-opacity", 0.3)
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .on("click", (d, i) => {
                    // 高亮自身
                    scatterChart.G.selectAll("ellipse")
                                .style("stroke", "black")
                                .style("stroke-width", "1px");
                    scatterChart.G.select("#group_" + i)
                                .style("stroke", d3.schemePaired[i])
                                .style("stroke-width", "3px");
                    // 点击高亮所包含的地区的路径
                    flowChart.SVG.selectAll(".path")
                                .style("opacity", 0.3)
                                .style("stroke-width", '1px');
                    dataList.forEach(item => {
                        if (item.label === i) {
                            flowChart.SVG.select("#path_" + PrvcnmDict[item.id])
                                        .style("opacity", 1)
                                        .style("stroke-width", "4px");
                        }
                    });
                })
                .on("mouseenter", (d, i) => {
                    /** 对应的地区名称 */
                    let names = [];
                    dataList.forEach(item => {
                        if (item.label === i) {
                            names.push(PrvcnmDict[item.id]);
                        }
                    });
                    /** 散点图容器 DOM 的浏览器定位 */
                    const bounding = d3.select("#SVGscatterChart").node().getBoundingClientRect();
                    tooltip.show()
                            .moveTo(bounding.x + d.cx + Math.max(d.rx, d.ry) + 10, bounding.y + d.cy)
                            .html(names.join("<br />"));
                })
                .on("mouseleave", () => {
                    tooltip.hide();
                });
        // 椭圆 exit 部分绘制逻辑
        ellipses.exit().remove();

        // 绘制散点
        /** 散点 update 部分 */
        const scatters = scatterChart.SVG.selectAll("circle").data(dataList);
        // 散点 update 部分绘制逻辑
        scatters.attr("id", d => ("scatter_" + PrvcnmDict[d.id]))
                .attr("cx", d => {
                    return scatterChart.padding.left + scatterChart.scaleX(d.coordinates[0]);
                })
                .attr("cy", d => {
                    return scatterChart.padding.top + scatterChart.scaleY(d.coordinates[1]);
                })
                .style("fill", d => d3.schemePaired[d.label])
                .on("mouseenter", d => {
                    /** 散点图容器 DOM 的浏览器定位 */
                    const bounding = d3.select("#SVGscatterChart").node().getBoundingClientRect();
                    tooltip.show()
                            .moveTo(
                                bounding.x + scatterChart.padding.left + scatterChart.scaleX(d.coordinates[0]) + 16,
                                bounding.y + scatterChart.padding.top + scatterChart.scaleY(d.coordinates[1])
                            )
                            .html(PrvcnmDict[d.id]);
                })
                .on("mouseleave", () => {
                    tooltip.hide();
                })
                .on("click", d => {
                    // 高亮对应元素
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
                                    .style("opacity", 0.3)
                                    .style("stroke-width", '1px');
                    flowChart.SVG.select("#path_" + d.name)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    // 交互
                    // 这里用到了两个函数去获取而不是设置，即获取了指定元素已经绑定的点击事件，以及其绑定的数据
                    d3.select("#column_" + PrvcnmDict[d.id]).on("click")(
                        d3.select("#column_" + PrvcnmDict[d.id]).datum()
                        // 等价于从 DOM 树上重新取出了绑定的数据：
                        // d3.select("#column_" + PrvcnmDict[d.id])._groups[0][0].__data__
                    );
                });
        // 散点 enter 部分绘制逻辑
        scatters.enter()
                .append("circle")
                .attr("class", "scatter")
                .attr("id", d => ("scatter_" + PrvcnmDict[d.id]))
                .attr("cx", d => {
                    return scatterChart.padding.left + scatterChart.scaleX(d.coordinates[0]);
                })
                .attr("cy", d => {
                    return scatterChart.padding.top + scatterChart.scaleY(d.coordinates[1]);
                })
                .attr("r", d => {
                    if (pieChart.state && PrvcnmDict[d.id] === pieChart.state.name) {
                        return "8px";
                    } else {
                        return "5px";
                    }
                })
                .style("stroke", "red")
                .style("stroke-width", d => {
                    if (pieChart.state && PrvcnmDict[d.id] === pieChart.state.name) {
                        return "3px";
                    } else {
                        return "0.5px";
                    }
                })
                .style("fill", d => d3.schemePaired[d.label])
                .on("mouseenter", d => {
                    /** 散点图容器 DOM 的浏览器定位 */
                    const bounding = d3.select("#SVGscatterChart").node().getBoundingClientRect();
                    tooltip.show()
                            .moveTo(
                                bounding.x + scatterChart.padding.left + scatterChart.scaleX(d.coordinates[0]) + 16,
                                bounding.y + scatterChart.padding.top + scatterChart.scaleY(d.coordinates[1])
                            )
                            .html(PrvcnmDict[d.id]);
                })
                .on("mouseleave", () => {
                    tooltip.hide();
                })
                .on("click", d => {
                    // 高亮对应元素
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
                                    .style("opacity", 0.4)
                                    .style("stroke-width", '1px');
                    flowChart.SVG.select("#path_" + d.name)
                                    .style("opacity", 1)
                                    .style("stroke-width", "4px");
                    // 交互
                    d3.select("#column_" + PrvcnmDict[d.id]).on("click")(
                        d3.select("#column_" + PrvcnmDict[d.id])._groups[0][0].__data__
                    );
                });
        // 散点 exit 部分绘制逻辑
        scatters.exit().remove();
    },
    /**
     * 更新当前年份。
     * @public 外部接口
     * @param {number} year 设置的年份
     */
    update: year => {
        if (!scatterChart.state) {
            // 如果散点图数据未完成加载，则阻止触发重绘逻辑
            return;
        }
        scatterChart.render(scatterChart.state[year]);
    }
};
