/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-11 15:42:51 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-26 16:57:47
 */
"use strict";

/**
 * 这个对象用于封装所有用于和产生于柱状图的属性和逻辑
 */
const columnChart = {
    /** 加载柱状图相关元素的 SVG 标签 */
    SVG: d3.select("#SVGcolumnChart"),
    /** 柱状图对应 SVG 容器的实际宽度 */
    width: parseInt(d3.select("#SVGcolumnChart").attr("width")),
    /** 柱状图对应 SVG 容器的实际高度 */
    height: parseInt(d3.select("#SVGcolumnChart").attr("height")),
    /** 记录 GDP 数据各标签是否激活的筛选器 */
    filter: {
        Gdp0101: true,  Gdp0102: true,  Gdp0103: true,  Gdp0104: true,  Gdp0105: true,  Gdp0106: true,
        Gdp0107: true,  Gdp0108: true,  Gdp0109: true,  Gdp0110: true,  Gdp0111: true,  Gdp0112: true,
        Gdp0113: true,  Gdp0114: true,  Gdp0115: true,  Gdp0116: true,  Gdp0126: true,  Gdp0127: true,
        Gdp0128: true,  Gdp0131: true
    },
    /** 柱状图对应 SVG 容器的内部间隔 */
    padding: {
        top: 24, right: 20, bottom: 40, left: 50
    },
    /** 当前数据对应的年份 */
    currentYear: NaN,
    /** 当前交互选中的地区(名称) */
    activeProv: null,
    /** 柱状图的垂直方向比例尺 */
    scaleY: null,
    /**
     * 柱状图加载的数据
     * @type {{[year: number]: {[prov: string]: {[gdpLabel: string]: number}}} | null}
     */
    state: null,
    /**
     * 完成元素渲染。
     * @private 内部逻辑
     */
    render: () => {
        /** 根据当前年份从加载的数据中选取对应的部分 */
        const origin = columnChart.state[columnChart.currentYear];
        /** 本次渲染产生的数据列表，单个列表元素组成部分包括地区名称、总值与各个分项的字典 */
        let data = [];
        /** 本次渲染数据的最大值，初始化为 100 以保证定义域区间长度不为 0 */
        let max = 100;
        if (origin) {
            for (const prov in origin) {
                if (origin.hasOwnProperty(prov)) {
                    /** 数据中某个地区的 GDP 信息 */
                    const gdp = origin[prov];
                    /** 记录当前地区 GDP 总值 */
                    let value = 0;
                    /** 各分项的 GDP 键值对 */
                    let each = {};
                    // 根据筛选器抽取数据
                    for (const key in columnChart.filter) {
                        if (columnChart.filter.hasOwnProperty(key)) {
                            /** 此标签由筛选器记录的激活状态 */
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
        /** 一个柱形可分配的区间宽度 */
        const columnSpan = (columnChart.width - columnChart.padding.left - columnChart.padding.right) / data.length;
        /** 一个柱形实际的宽度 = 所分配空间宽度 * 0.6，在区间居中 */
        const columnWidth = columnSpan * 0.6;
        // 更新比例尺
        columnChart.scaleY = d3.scaleLinear()
                                .domain([0, max * 1.1])     // 稍微扩大一些以留出空隙
                                // y 轴的增长方向应与投影坐标成负相关
                                .range([columnChart.height - columnChart.padding.top - columnChart.padding.bottom, 0]);

        /** 用于放置坐标轴的容器 */
        const g = columnChart.SVG.selectAll(".axes").data([0]); // 绑定任意一个长度为 1 的列表以保证只存在一个坐标轴容器
        
        /** 由当前比例尺生成的坐标轴，产生 5 个刻度 */
        const yAxis = d3.axisLeft(columnChart.scaleY).ticks(5);
        // 将坐标轴应用到已存在的容器中
        g.call(yAxis);
        // 若容器尚不存在，则添加容器并初始化
        g.enter()
            .append("g")                                    // 添加放置坐标轴的容器
            .attr("class", "axes")                          // 添加用于选择器的类名
            // 对容器添加平移，以使其中元素的绘制原点与坐标轴原点对齐
            .attr("transform", "translate(" + columnChart.padding.left + "," + columnChart.padding.top + ")")
            .call(yAxis)                                    // 将坐标轴应用到容器中
            .append("line")                                 // 在柱状图底部手动绘制一条线(不是坐标轴)(不需要重绘逻辑)
            .attr("x1", 0)                                  // 以下四行：将直线对齐到柱状图内间距的下边框
            .attr("y1", columnChart.height - columnChart.padding.bottom - columnChart.padding.top)
            .attr("x2", columnChart.width - columnChart.padding.right - columnChart.padding.left)
            .attr("y2", columnChart.height - columnChart.padding.bottom - columnChart.padding.top)
            .style("stroke", "#808080");
        // 设置生成刻度的样式
        columnChart.SVG.select(".domain").attr("stroke", "#808080");
        
        /** 柱形 update 部分 */
        const columns = columnChart.SVG.selectAll("rect").data(data);
        // 柱形 update 部分绘制逻辑
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
                    // 高亮对应的元素
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
                    // 应用到交互事件
                    columnChart.onClick(d);
                });

        // 柱形 enter 部分绘制逻辑
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
                    // 高亮对应的元素
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
                    // 应用到交互事件
                    columnChart.onClick(d);
                });
        
        // 柱形 exit 部分绘制逻辑
        columns.exit().remove();

        /** 标签 update 部分 */
        const labelProv = columnChart.SVG.selectAll(".labelProv").data(data);

        // 标签 update 部分绘制逻辑
        labelProv.attr("transform", (d, i) =>
                        ("translate("
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(0) + 4)
                    + "), rotate(270)")
                )
                .text(d => d.name.replace(/省|市|(维吾尔|回族|壮族)?自治区/, ""));  // 使用正则表达式去除不必要的字符以缩短长度

        // 标签 enter 部分绘制逻辑
        labelProv.enter()
                .append("text")
                .attr("class", "labelProv")
                .attr("transform", (d, i) =>        // 使用平移属性代替 x, y 属性定位，
                    ("translate("                   // 因为 rotate 属性的旋转中心坐标默认为其平移属性的值
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(0) + 4)
                    + "), rotate(270)")
                )
                .attr("text-anchor", "end")         // 文本右端对齐
                .style("font-size", "10.5px")
                .text(d => d.name.replace(/省|市|(维吾尔|回族|壮族)?自治区/, ""));

        // 标签 exit 部分绘制逻辑
        labelProv.exit().remove();

        /** 值文本 update 部分 */
        const labelValue = columnChart.SVG.selectAll(".labelValue").data(data);

        // 值文本 update 部分绘制逻辑
        labelValue.attr("transform", (d, i) =>
                        ("translate("
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(d.value) - 4)
                    + "), rotate(270)")
                )
                .text(d => Math.floor(d.value));

        // 值文本 enter 部分绘制逻辑
        labelValue.enter()
                .append("text")
                .attr("class", "labelValue")
                .attr("transform", (d, i) =>
                    ("translate("
                        + (columnChart.padding.left + columnSpan * (i + 1) - columnWidth / 2 + 1.5)
                    + ","
                        + (columnChart.padding.top + columnChart.scaleY(d.value) - 4)
                    + "), rotate(270)")
                )
                .attr("text-anchor", "begin")        // 文本左端对齐
                .style("font-size", "8px")
                .text(d => Math.floor(d.value));

        // 值文本 exit 部分绘制逻辑
        labelValue.exit().remove();

        if (columnChart.activeProv) {
            for (let i = 0; i < data.length; i++) {
                if (data[i].name === columnChart.activeProv) {
                    // 更新交互信息
                    columnChart.onClick(data[i]);
                    return;
                }
            }
        }
        // 没有选中地区时的交互逻辑
        columnChart.onClick({
            name: pieChart.state ? pieChart.state.name : 'undefined',
            value: 0,
            details: {}
        });
    },
    /**
     * 设置当前年份，
     * 一定触发 render() 方法。
     * @public 外部接口
     * @param {number} nextYear 将设置的年份
     */
    setYear: nextYear => {
        columnChart.currentYear = nextYear;
        columnChart.render();
    },
    /**
     * 加载数据，
     * 一定触发 render() 方法。
     * @public 外部接口
     * @param {{[year: number]: {[prov: string]: {[gdpLabel: string]: number}}}} nextState 将导入的数据
     */
    update: nextState => {
        // 更新柱状图记录的数据
        columnChart.state = nextState;
        if (isNaN(columnChart.currentYear)) {
            // 如果当前年份未初始化，则初始化其为第一个记录年份
            columnChart.currentYear = parseInt(Object.keys(nextState)[0]);
        }

        columnChart.render();
    },
    /**
     * 监听自柱状图产生的点击事件，
     * 触发饼图更新。
     * @private 内部逻辑
     * @param {{name: string, value: number, details: {[gdpLabel: string]: number}}} data 监听发起元素所绑定的数据 
     */
    onClick: data => {
        columnChart.activeProv = data.name;
        pieChart.update(data);
    }
};
