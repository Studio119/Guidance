/*
 * @Author: Antoine YANG 
 * @Date: 2020-01-11 15:42:48 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-01-16 12:14:44
 */
"use strict";

/**
 * Load GDP data from local json file
 */
const loadData = () => {
    d3.json('./gdp.json')
        .then(res => {
            // Callback
            const data = convertData(res);
            columnChart.update(data);
        }).catch(err => {
            console.info(err);
        });
};


/**
 * Convert GDP data into time-and-city-tagged objects
 * @param {*} list loaded list object
 */
const convertData = list => {
    let timeline = {};
    list.forEach(item => {
        // Seperate informations from each element
        const { Prvcnm, Prvcnm_id, Sgnyea, ...datum } = item;
        if (Prvcnm === '中国') {
            // Skip items attributede to '中国'
            return;
        }
        if (!timeline.hasOwnProperty(Sgnyea)) {
            timeline[Sgnyea] = {};
        }
        // Fix empty records
        for (const key in datum) {
            if (datum.hasOwnProperty(key)) {
                const value = datum[key];
                if (value === "" || parseFloat(value) < 0) {
                    // if this is an empty record or an invalid record, replace it with 0
                    datum[key] = 0;
                }
            }
        }
        timeline[Sgnyea][Prvcnm] = datum;
    });

    return timeline;
};


// When this script is parsed, start to fetch data
loadData();
