/*
 * @Author: Antoine YANG 
 * @Date: 2020-02-07 13:07:39 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-07 17:37:21
 */
"use strict";

// 在这里，使用 JavaScript 原型链技术先构造一个类模板。同样的功能也可以直接由对象实现。
/**
 * 封装地图相关逻辑的对象的构造器。
 * @constructor 构造方法
 * @param {string} parentId 父容器的 id
 */
function CustomerMap(parentId) {
    // 设置全局 mapbox 令牌
    mapboxgl.accessToken = "pk.eyJ1IjoiaWNoZW4tYW50b2luZSIsImEiOiJjazF5bDh5eWUwZ2tiM2NsaXQ3bnFvNGJ1In0.sFDwirFIqR4UEjFQoKB8uA";
    // 创建 mapbox 地图
    this.map = new mapboxgl.Map({
        container: parentId,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [104, 37], // 地图起始中心坐标（[经度，纬度]）
        zoom: 2.5,
        interactive: false // 禁用交互
    });
    // 在地图加载完成后，加载每个地区对应的点
    this.map.on("load", () => {
        d3.json("./geo-dict.json")
            .then(dict => {
                // 将图标按照纬度排序以防止反常识的物理遮盖
                Object.entries(dict).sort((a, b) => b[1][1] - a[1][1]).forEach(entry => {
                    /**
                     * 地区名
                     * @type {string}
                     */
                    const name = entry[0];
                    /**
                     * 坐标
                     * @type {[number, number]}
                     */
                    const cordinate = entry[1];
                    /**
                     * 标记
                     * @type {mapboxgl.Marker}
                     */
                    const marker = new mapboxgl.Marker();
                    // 设置标记经纬度坐标并添加至地图中
                    marker.setLngLat(cordinate).addTo(this.map);
                    
                    /**
                     * 弹窗
                     * @type {mapboxgl.Popup}
                     */
                    const popup = new mapboxgl.Popup({
                        closeButton: false
                    });
                    popup.setHTML(
                        "<p>" + name + "</p>"
                        + "<p class='content'>没有数据</p>"
                        + "<button style='pointer-events: all; display: none;'>使用同步</button>"
                    ).on("open", () => {
                        /**
                         * 弹窗对应的 HTML 元素
                         * @type {HTMLDivElement}
                         */
                        const dom = popup.getElement();
                        // 鼠标移出画布后关闭弹窗，以防止其他窗口产生的交互更改数据
                        d3.select(".mapboxgl-canvas")
                            .on("mouseout", () => {
                                popup._onClickClose();
                            });
                        /**
                         * 弹窗内的按钮
                         * @type {d3.selection}
                         */
                        const button = d3.select(dom).select("button");
                        /**
                         * 弹窗内的数据文本
                         * @type {d3.selection}
                         */
                        const content = d3.select(dom).select(".content");

                        /**
                         * 从柱状图中，代理完成数据获取的元素
                         * @type {d3.selection}
                         */
                        const proxy = columnChart.SVG.select("#column_" + name);
                        if (proxy._groups[0][0] === void(0)) {
                            // 元素不存在
                            button.style("display", "none");
                            content.text("没有数据");
                        } else {
                            button.style("display", "unset")
                                .on("click", () => {
                                    this.onClick(name, proxy);
                                });
                            content.text("总计 = " + proxy.datum().value + "万元");
                        }
                    });

                    // 为标记绑定弹窗
                    marker.setPopup(popup);
                });
            })
            .catch(err => {
                console.warn(err);
            });
    });
}

/**
 * mapbox 地图
 * @type {mapboxgl.Map}
 * @memberof CustomerMap
 */
CustomerMap.prototype.map = null;

/**
 * 监听自地图产生的交互。
 * @private 内部逻辑
 * @param {string} name 监听发起元素对应的地区名称
 * @param {d3.selection} proxy 代理完成数据获取的元素
 */
CustomerMap.prototype.onClick = (name, proxy) => {
    // 高亮对应的元素
    columnChart.SVG.selectAll("rect")
        .style("stroke", "none")
        .style("fill-opacity", 1);
    columnChart.SVG.select("#column_" + name)
        .style("fill-opacity", 0.5)
        .style("stroke", "red")
        .style("stroke-width", "3px");
    scatterChart.SVG.selectAll("circle")
        .attr("r", "5px")
        .style("stroke-width", "0.5px");
    scatterChart.SVG.select("#scatter_" + name)
        .attr("r", "8px")
        .style("stroke-width", "3px");
    flowChart.SVG.selectAll(".path")
        .style("opacity", 0.6)
        .style("stroke-width", '1px');
    flowChart.SVG.select("#path_" + name)
        .style("opacity", 1)
        .style("stroke-width", "4px");
    // 应用到交互事件
    const data = proxy.datum();
    columnChart.activeProv = name;
    pieChart.update(data);
}
