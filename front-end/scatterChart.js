/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-25 13:31:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-26 17:36:50
 */

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

        /** 列表形式的散点数据 */
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
                                    .style("opacity", 0.6)
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
                                    .style("opacity", 0.6)
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
