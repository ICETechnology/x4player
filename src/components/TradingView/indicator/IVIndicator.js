export function getIVIndicator(PineJS) {
	return {
		name: "iv",
		metainfo: {
			// 指標元數據的版本
			"_metainfoVersion": 1,
			// 指標的唯一標識符
			"id": "iv@tv-basicstudies-1",
			// 腳本ID的一部分，通常在內部使用，可以將其保留為空字符串
			"scriptIdPart": "",
			// 指標的全名。這將在指標列表中顯示給終端用戶
			"name": "IV",
			// 指標的描述。這將在指標的詳細信息中顯示給終端用戶。
			"description": "IV",
			// 指標的簡短描述。這將在指標列表中顯示給終端用戶。
			"shortDescription": "IV",
			// 表示指標是否應該在指標列表中隱藏
			"is_hidden_study": false,
			// 表示指標是否基於價格數據
			"is_price_study": false,
			// 表示指標是否為自定義指標
			"isCustomIndicator": true,
			// 包含指標繪圖設定的陣列
			"plots": [{ "id": "plot_0", "type": "line" }],
			// 指標的預設設定，例如繪圖樣式、精確度和輸入值
			"defaults": {
				"styles": {
					"plot_0": {
						"linestyle": 0,
						"visible": true,
						// 繪圖線寬度
						"linewidth": 2,
						// 繪圖類型:
						//    1 - 直方圖
						//    2 - 線形圖
						//    3 - 十字指針
						//    4 - 山形圖
						//    5 - 柱狀圖
						//    6 - 圓圈圖
						//    7 - 中斷線
						//    8 - 中斷區塊
						"plottype": 2,
						// 顯示價格線
						"trackPrice": false,
						// 透明度: 百分比
						"transparency": 40,
						// hex 線條顏色
						"color": "#FFFF00"
					}
				},
				// 指標數值的小數位數
				"precision": 2,
				"inputs": {}
			},
			// 指標的繪圖樣式設定，例如標題、直方圖基線
			"styles": {
				"plot_0": {
					"title": "-- output name --",
					"histogramBase": 0,
				}
			},
			// 包含指標輸入參數的陣列
			"inputs": [],
		},
		constructor: function () {
			// this.init = function (context, inputCallback) {
				// this._context = context;
				// this._input = inputCallback;
				// symbol: 資料源的標識符
				// const symbol = PineJS.Std.ticker(context);
				// resolution: 資料源的時間解析度
				// const resolution = PineJS.Std.period(context);
				// 創建一個新的資料源
				// context.new_sym(symbol, resolution);
			// };
			// 逐 tick 呼入，逐 tick return
			this.main = function (context, inputCallback) {
				this._context = context;
				this._input = inputCallback;
				// 該整數表示要選擇的資料源索引，通常情況下，在PineJS中，第一個資料源（索引為0）是默認的資料源，包含了主圖表的資料
				// this._context.select_sym(1);

				// time : 1679414400000
				const time = PineJS.Std.time(this._context);
				if (isNaN(time))
					return;
				// sid : "I.O.TWF.TX1.202304.C.15600"
				const sid = PineJS.Std.ticker(this._context);
				let period = PineJS.Std.period(this._context);
				// console.log('period : ', period)
				const date = new Date(time);
				let timeStr;
				if (period === '1D' || period === '1W' || period === '1M') {
					period = "d";
					// timeStr = "20230322"
					timeStr = date.yyyymmdd();
				} else {
					timeStr = date.yyyymmddhhmm();
				}
                // queryKey : "I.O.TWF.TX1.202304.C.15600,d"
                const queryKey = `${sid},${period}`;
                const data = window.M4C.SciChartData.chartData[queryKey];
                if (typeof data !== "object" || data === null)
                    return;
                const bar = data[timeStr];
                if (!bar)
                    return;
                if (typeof bar.iv !== "number" || isNaN(bar.iv)) {
                    // console.log('timeStr : ', timeStr , ', bar.iv : ', bar.iv);
                    return;
                }                  
                return [bar.iv];
			}
		}
	};
}
