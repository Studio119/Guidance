/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-25 13:31:29 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-25 21:38:56
 */

const scatterChart = {
    SVG: d3.select("#SVGscatterChart"),
    width: parseInt(d3.select("#SVGscatterChart").attr("width")),
    height: parseInt(d3.select("#SVGscatterChart").attr("height")),
    padding: {
        top: 50, right: 50, bottom: 50, left: 50
    },
    state: null,
    scaleX: null,
    scaleY: null,
    initialize: state => {
        scatterChart.state = state;
        scatterChart.update(columnChart.currentYear);
    },
    render: data => {
        // Update the scales
        const range = Math.min(
            scatterChart.height - scatterChart.padding.top - scatterChart.padding.bottom,
            scatterChart.width - scatterChart.padding.left - scatterChart.padding.right
        );
        let domainX = [-0.1, 0.1];
        let domainY = [-0.1, 0.1];

        const dataList = Object.entries(data).map(entry => {     // 将对象转化为列表
            return {                // 每一个元素的格式
                id: entry[0],
                coordinates: [entry[1][0], entry[1][1]],
                label: entry[1][2]
            };
        });

        dataList.forEach(d => {         // 遍历键值对，更新 x 和 y 坐标的最小最大值
            domainX = [
                Math.min(domainX[0], d.coordinates[0]),
                Math.max(domainX[1], d.coordinates[0])
            ];
            domainY = [
                Math.min(domainY[0], d.coordinates[1]),
                Math.max(domainY[1], d.coordinates[1])
            ];
        });

        // 这里为保证两个坐标的缩放比例相等，取两组中长度最大的一组，另一组对其统一长度并居中
        const distanceX = domainX[1] - domainX[0];
        const distanceY = domainY[1] - domainY[0];
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

        scatterChart.scaleX = d3.scaleLinear()
                                .domain(domainX)
                                .range([0, range]);

        scatterChart.scaleY = d3.scaleLinear()
                                .domain(domainY)
                                .range([range, 0]);

        // Render the scatters
        const scatters = scatterChart.SVG.selectAll("circle").data(dataList);
        scatters.attr("id", d => ("scatter_" + PrvcnmDict[d.id]))
                .attr("cx", d => {
                    return scatterChart.padding.left + scatterChart.scaleX(d.coordinates[0]);
                })
                .attr("cy", d => {
                    return scatterChart.padding.top + scatterChart.scaleY(d.coordinates[1]);
                })
                .on("click", d => {
                    // hightlight corresponding elements
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
                    // interaction
                    // 这里用到了两个函数去获取而不是设置，即获取了指定元素已经绑定的点击事件，以及其绑定的数据
                    d3.select("#column_" + PrvcnmDict[d.id]).on("click")(
                        d3.select("#column_" + PrvcnmDict[d.id]).datum()
                        // 等价于从 DOM 树上重新取出了绑定的数据：
                        // d3.select("#column_" + PrvcnmDict[d.id])._groups[0][0].__data__
                    );
                });
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
                    // hightlight corresponding elements
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
                    // interaction
                    d3.select("#column_" + PrvcnmDict[d.id]).on("click")(
                        d3.select("#column_" + PrvcnmDict[d.id])._groups[0][0].__data__
                    );
                });
        scatters.exit().remove();
    },
    update: year => {
        if (!scatterChart.state) {
            return;
        }
        scatterChart.render(scatterChart.state[year]);
    }
};
