onmessage = function(e) {
	// 接收參數
	let {action, data, p} = e.data;
	// 資料運算
	let result = {};
	switch (action) {
		case 'calc_TimeKeyList_ChartData':
			let timeKeyList = Object.keys(data);
			// 回補情境
			if (!p.byRealTimeTick) {
				// 將 timeKeyList 排序
				let sortedTimeKeyList = timeKeyList.sort();
				// 將 chartData 排序
				let sortedChartData = {};
				sortedTimeKeyList.forEach((key)=>{sortedChartData[key] = data[key]});
				result.chartData = sortedChartData;
				result.timeKeyList = sortedTimeKeyList;
			}
			// 即時情境 (不用 sort，不用重建 chartData)
			else {
				// result.chartData = data;
				result.timeKeyList = timeKeyList;
			}
			break;
	}
	// 送出結果
	postMessage({action, result, p});
};
