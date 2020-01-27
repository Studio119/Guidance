/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-11 15:42:48 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-27 18:19:00
 */
"use strict";

/**
 * 用 id 索引名称的键值对
 * @type {{[id: number]: string}}
 */
var PrvcnmDict = {};

/**
 * 发送数据请求，读取本地文件。
 * @async 强制同步操作
 */
const loadData = async () => {
    // 第一个操作：同步读取 GDP 原始数据
    await d3.json('./gdp.json')
            .then(res => {
                // 回调函数
                /**
                 * 柱状图所需的数据
                 * @type {{[year: number]: {[prov: string]: {[gdpLabel: string]: number}}}}
                 */
                const data = convertData(res);
                // 柱状图导入数据
                columnChart.update(data);

                // 初始化时间轴
                initializeTimeSlider(Object.keys(data).sort((a, b) => (a - b)));
            }).catch(err => {
                console.warn(err);
            });
    // 第二个操作：同步读取 MDS & k-means 处理后的数据
    await d3.json("../back-end/output_file_k-means.json")
            .then(res => {
                // 回调函数
                // 初始化特征散点图
                scatterChart.initialize(res);
                // 初始化○○图
                flowChart.initialize(res);
            }).catch(err => {
                console.warn(err);
            });
};


/**
 * 将 GDP 原始数据转换为柱状图所需格式。
 * @param {Array<{
    * Sgnyea: number, Prvcnm_id: number, Prvcnm: string, Gdp0101: number | string, Gdp0102: number | string,
    * Gdp0103: number | string, Gdp0104: number | string, Gdp0105: number | string, Gdp0106: number | string,
    * Gdp0107: number | string, Gdp0108: number | string, Gdp0109: number | string, Gdp0110: number | string,
    * Gdp0111: number | string, Gdp0112: number | string, Gdp0113: number | string, Gdp0114: number | string,
    * Gdp0115: number | string, Gdp0116: number | string, Gdp0126: number | string, Gdp0127: number | string,
    * Gdp0128: number | string, Gdp0131: number | string
 * }>} list 原始数据
 * @returns {{[year: number]: {[prov: string]: {[gdpLabel: string]: number}}}} 柱状图数据格式
 */
const convertData = list => {
    /**
     * 以年份为一级索引，地区名称为二级索引，标签名为三级索引的数据对象
     * @type {{[year: number]: {[prov: string]: {[gdpLabel: string]: number}}}}
     */
    let timeline = {};
    list.forEach(item => {
        // 运用解构运算提取出一个数据项中的所需数据和其它对应字段值
        const { Prvcnm, Prvcnm_id, Sgnyea, ...datum } = item;
        if (Prvcnm_id === 142) {
            // 跳过所有 Prvcnm_id === 142 (即"中国")的数据项
            return;
        } else {
            // 将地区 id 与名称的键值对关系记录到全局对象中
            PrvcnmDict[Prvcnm_id] = Prvcnm;
        }
        if (!timeline.hasOwnProperty(Sgnyea)) {
            // 为初次出现的年份初始化一个空对象
            timeline[Sgnyea] = {};
        }
        for (const key in datum) {
            if (datum.hasOwnProperty(key)) {
                /**
                 * 单项标签对应的值
                 * @type {number}
                 */
                const value = typeof(datum[key]) === "number" ? datum[key] : parseFloat(datum[key]);
                if (value < 0 || isNaN(value)) {
                    // 如果数据无效，记录为 0
                    datum[key] = 0;
                }
            }
        }
        // 将清洗整理好的数据写入对象
        timeline[Sgnyea][Prvcnm] = datum;
    });

    return timeline;
};

/**
 * 更新表单修改至柱状图记录的筛选器。
 * @param {string} name 产生更改的复选框对应的地区名称
 */
const updateCheckbox = name => {
    /**
     * 产生更改的复选框当前的选中状态
     * @type {boolean}
     */
    const status = d3.select("#checkbox" + name)._groups[0][0].checked;
    if (columnChart.filter[name] === status) {
        return;
    }
    // 如果产生更新，则应用至筛选器，并强制重绘
    columnChart.filter[name] = status;
    columnChart.render();
};

/**
 * 根据筛选器中的标签自动生成用于交互的复选框组件。
 * 自动调用。
 */
(() => {
    /**
     * 标签名列表。
     * @type {Array<string>}
     */
    const checkboxLabels = Object.keys(columnChart.filter);
    /** 放置复选框的容器 */
    const checkboxContainer = d3.select("#checkboxContainer");

    /** 复选框对象的集合 */
    let checkboxes = [];

    checkboxLabels.forEach((label, index) => {
        /** 新建的复选框对象 */
        const input = checkboxContainer.append("input")
                        .attr("type", "checkbox")
                        .attr("id", "checkbox" + label)
                        .attr("checked", "checked")
                        .on('click', () => {
                            updateCheckbox(label);
                        });
        checkboxes.push(input);
        // 添加文本标签
        checkboxContainer.append("label").text(label).on('click', () => {
            // 绑定对应的复选框的监听至文本标签的监听
            input._groups[0][0].checked = !input._groups[0][0].checked; // 更改对应复选框的选中状况
            input._groups[0][0].__on[0].listener();                     // 主动触发对应复选框的监听
        });
        if (index % 2 === 1 || index === checkboxLabels.length - 1) {
            // 添加换行
            checkboxContainer.append("br");
        }
    });

    // 添加全选按钮
    checkboxContainer.append("button")
        .text("Select All")
        .style("margin-left", "14px")
        .on('click', () => {
            checkboxes.forEach(input => {
                input._groups[0][0].checked = true;
                input._groups[0][0].__on[0].listener();
        });
    });

    // 添加选择反向按钮
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
 * 初始化时间轴。
 * @param {{[year: number]: {[prov: string]: {[gdpLabel: string]: number}}}} timeTable 柱状图格式数据
 */
const initializeTimeSlider = timeTable => {
    /** 容器内间距 */
    const padding = { top: 24, side: 30 };
    /** 适应长度的时间比例尺 */
    const timeScale = d3.scaleLinear()
                        .domain([timeTable[0], timeTable[timeTable.length - 1]])
                        .range([0, parseInt(d3.select("#timeSlider").attr("width")) - padding.side * 2]);
    /** 按照四倍的比例设定○○图的 x 轴比例尺 */
    flowChart.scaleX = d3.scaleLinear()
                        .domain([timeTable[0], timeTable[timeTable.length - 1]])
                        .range([0, (parseInt(d3.select("#timeSlider").attr("width")) - padding.side * 2) * 4]);
    /** 时间轴的容器 */
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
    /** 基于时间比例尺生成的坐标轴 */
    const axis = d3.axisBottom(timeScale).ticks(0);
    // 将时间坐标轴应用于容器
    g.call(axis);
    /** 可拖拽实体的半径 */
    const r = (timeScale(timeTable[1]) - timeScale(timeTable[0])) * 0.3;
    /** 标记实体(外圆周) */
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
    /** 可拖拽实体(内圆) */
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
    /** 当前年份显示文本 */
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
    
    // /** 深色的指示背景 */
    // const highlight = d3.select("#timeSlider")
    //                 .append("rect")
    //                 .attr("id", "slideHighlight")
    //                 .attr("x", timeScale(timeTable[0]) - 30 + padding.side)
    //                 .attr("y", flowChart.padding.top - 294)
    //                 .attr("width", 60)
    //                 .attr("height", flowChart.height - flowChart.padding.top - flowChart.padding.bottom)
    //                 .style("transform", "translateX(0)")
    //                 .style("fill", "#101020");

    /** 可拖拽实体的拖曳行为 */
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
                                // highlight.style("transform", "translateX(" + timeScale(currentYear) + "px)");
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
    // 将拖拽监听应用于接受交互的实体
    focus.call(behavior);
};


// 从导入数据开始加载流程。
loadData();
