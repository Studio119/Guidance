/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-12 21:33:09 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-26 17:23:59
 */
"use strict";

/**
 * 饼图封装对象
 */
const pieChart = {
    /** 加载饼图相关元素的 SVG 标签 */
    SVG: d3.select("#SVGpieChart"),
    /** 饼图对应 SVG 容器的实际宽度 */
    width: parseInt(d3.select("#SVGpieChart").attr("width")),
    /** 饼图对应 SVG 容器的实际宽度 */
    height: parseInt(d3.select("#SVGpieChart").attr("height")),
    /** 饼图对应 SVG 容器的内部间隔 */
    padding: {
        top: 60, right: 40, bottom: 40, left: 40
    },
    /**
     * 柱状图加载的数据
     * @type {{name: string, data: number} | null}
     */
    state: null,
    /** 当前各项数据的和 */
    sum: 0,
    /**
     * 完成元素渲染。
     * @private 内部逻辑
     */
    render: () => {
        /** 标题：当前选中的地区名称 update 部分 */
        const title = pieChart.SVG.selectAll(".title").data([pieChart.state]);
        // 标题 update 部分绘制逻辑
        title.text(d => {
            return d.name === "undefined" ? "" : d.name;
        });
        // 标题 enter 部分绘制逻辑
        title.enter()
            .append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", pieChart.width / 2)
            .attr("y", pieChart.padding.top / 2)
            .text(d => {
                return d.name === "undefined" ? "" : d.name;
            });
        // 标题 exit 部分绘制逻辑
        title.exit().remove();
        /** 弧生成器产生的绘制数据 */
        const arcs = d3.pie().sort((a, b) => a.name.localeCompare(b.name)).value(d => d.value)(pieChart.state.data);
        /** 扇形半径 */
        const r = Math.min(
            pieChart.width - pieChart.padding.left - pieChart.padding.right,
            pieChart.height - pieChart.padding.top - pieChart.padding.bottom
        ) / 2.5;
        /** 扇形 update 部分 */
        const path = pieChart.SVG.selectAll(".arc").data(arcs);
        // 扇形 update 部分绘制逻辑
        path.attr("d", d => d3.arc().innerRadius(r * 2 / 3).outerRadius(r)(d));
        // 扇形 enter 部分绘制逻辑
        path.enter()
            .append("path")
            .attr("class", "arc")
            .attr("d", d => d3.arc().innerRadius(r * 2 / 3).outerRadius(r)(d))
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
        // 扇形 exit 部分绘制逻辑
        path.exit().remove();

        /** 标签 update 部分 */
        const text = pieChart.SVG.selectAll(".pieText").data(arcs);
        // 标签 update 部分绘制逻辑
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
        // 标签 enter 部分绘制逻辑
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
        // 标签 exit 部分绘制逻辑
        text.exit().remove();
    },
    /**
     * 加载数据，
     * 一定触发 render() 方法。
     * @public 外部接口
     * @param {{name: string, value: number, details: {[gdpLabel: string]: number}}} data 将导入的数据
     */
    update: data => {
        // 重置和
        pieChart.sum = 0;
        /**
         * 每个标签即对应值的集合
         * @type {Array<{value: number, name: string}>}
         */
        const pieces = Object.entries(data.details).map(item => {
            pieChart.sum += item[1];    // 统计求和
            return {
                value: item[1],
                name: item[0]
            };
        });
        /** 每个扇形对应的数据 */
        let allItems = [];
        /** 因为所占比例过小而合并的一块扇形 */
        let others = {
            value: 0,
            name: 'others'
        };
        /** 因为上述原因被合并的标签名称 */
        let othersList = [];
        pieces.forEach(item => {
            /** 当前数据项所占比例 */
            const rate = item.value / pieChart.sum;
            if (rate < 0.03) {
                // 如果比例过低则收录入合并集合
                othersList.push(item.name);
                others.value += item.value;
            } else {
                allItems.push(item);
            }
        });
        if (others.value > 0) {
            // 若合并集合中有元素
            if (othersList.length === 1) {
                // 当合并集合中仅有一个元素，还原其名称加入扇形集合中
                allItems.push({
                    value: others.value,
                    name: othersList[0].name
                });
            } else {
                // 否则，将合并集合整体加入扇形集合中
                allItems.push(others);
            }
        }

        // 更新数据
        pieChart.state = {
            name: data.name,
            data: allItems
        };
        // 触发重绘
        pieChart.render();
    }
};
