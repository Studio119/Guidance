/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-27 13:04:17 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-02-07 17:59:09
 */


/**
 * 提示框对象
 */
const tooltip = {
    /** DOM 对象 */
    dom: d3.select("body")
            .append("div")
            .attr("id", "tooltip")
            .style("background-color", "beige")
            .style("border", "1px solid black")
            .style("padding", "4px 8px")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("top", "0px")
            .style("left", "0px")
            .style("pointer-events", "none")
            .html("信息"),
    /**
     * 显示提示框。
     * @public 外部接口
     * @returns 原引用
     */
    show: () => {
        tooltip.dom.style("visibility", "visible");
        return tooltip;
    },
    /**
     * 隐藏提示框。
     * @public 外部接口
     * @returns 原引用
     */
    hide: () => {
        tooltip.dom.style("visibility", "hidden");
        return tooltip;
    },
    /**
     * 移动提示框到指定绝对坐标。
     * @public 外部接口
     * @param {number} x x 轴绝对坐标
     * @param {number} y y 轴绝对坐标
     * @returns 原引用
     */
    moveTo: (x, y) => {
        tooltip.dom
                .style("left", x + "px")
                .style("top", y + "px");
        return tooltip;
    },
    /**
     * 设置提示框 innerHTML 。
     * @public 外部接口
     * @param {string} html 元素 innerHTML
     * @returns 原引用
     */
    html: html => {
        tooltip.dom.html(html);
        return tooltip;
    }
};
