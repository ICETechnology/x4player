export function getMADeductIndicator(PineJS) {
	return {
		name: 'MADeduct',
		metainfo: {
			_metainfoVersion: 1,
			isTVScript: false,
			isTVScriptStub: false,
			is_hidden_study: false,
			// 預設
			defaults: {
				palettes: {
					paletteId1: {
						// 扣抵標示及文字顏色對映表
						colors: {
							0: {
								color: 'rgba(156,39,176,1)',
								width: 1, // 要有該欄位否則console會持續報錯，可改變線條寬度。
								style: 0, // 要有該欄位否則console會持續報錯，目前測試到可改變線條樣式。
							},
							1: {
								color: 'rgba(255,109,0,1)',
								width: 1,
								style: 0,
							},
							2: {
								color: 'rgba(67,160,71,1)',
								width: 1,
								style: 0,
							},
							3: {
								color: 'rgba(38,198,218,1)',
								width: 1,
								style: 0,
							},
							4: {
								color: 'rgba(245,0,87,1)',
								width: 1,
								style: 0,
							},
						},
					},
				},
				styles: {
					plot_0: {
						linestyle: 0,
						linewidth: 1,
						color: '#FF5252',	
						plottype: 'shape_triangle_up',	// 標示的類型
						location: 'Bottom',				// 標示的位置
						size: 'tiny',					// auto, tiny, small, normal, large, huge
					},
					// line樣式設定
					sma_1: {
						linestyle: 0,
						linewidth: 1,
						color: '#FF0000',
					},
					sma_2: {
						linestyle: 0,
						linewidth: 1,
						color: '#00FF00',
					},
					sma_3: {
						linestyle: 0,
						linewidth: 1,
						color: '#FFFF00',
					},
					sma_4: {
						linestyle: 0,
						linewidth: 1,
						color: '#FF00FF',
					},
					sma_5: {
						linestyle: 0,
						linewidth: 1,
						color: '#FF5200',
					},
				},
				inputs: {
					"MAPeriod1": 5,
					"MAPeriod2": 10,
					"MAPeriod3": 20,
					"MAPeriod4": 0,
					"MAPeriod5": 0,
					"DataSource": "close"},
			},
			// 數據及顯示樣式(constructor內的main回傳的陣列格式)
			plots: [
				// 當前資料的顯示類型及id
				{
					id: 'sma_1',
					type: 'line',
				},
				{
					id: 'sma_2',
					type: 'line',
				},
				{
					id: 'sma_3',
					type: 'line',
				},
				{
					id: 'sma_4',
					type: 'line',
				},
				{
					id: 'sma_5',
					type: 'line',
				},
				{
					id: 'plot_0',
					type: 'shapes'
				},
				// 目標(target)顯示樣式及id
				{
					id: 'ma_color1',
					type: 'colorer',
					target: 'sma_1',
					title: '均線1',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color2',
					type: 'colorer',
					target: 'sma_2',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color3',
					type: 'colorer',
					target: 'sma_3',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color4',
					type: 'colorer',
					target: 'sma_4',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color5',
					type: 'colorer',
					target: 'sma_5',
					palette: 'paletteId1',
				},
				// 目標(target)顯示樣式及id
				{
					id: 'plot_color',
					type: 'colorer',
					target: 'plot_0',
					palette: 'paletteId1',
				},
			],
			// 設定中輸入tab內的輸入設定
			inputs: [
				{"id": "MAPeriod1", "name": "均線週期1", "type": 'integer', "defval": 5, "min": 0},
				{"id": "MAPeriod2", "name": "均線週期2", "type": 'integer', "defval": 10, "min": 0},
				{"id": "MAPeriod3", "name": "均線週期3", "type": 'integer', "defval": 20, "min": 0},
				{"id": "MAPeriod4", "name": "均線週期4", "type": 'integer', "defval": 0, "min": 0},
				{"id": "MAPeriod5", "name": "均線週期5", "type": 'integer', "defval": 0, "min": 0},
				{"id": "DataSource", "name": "資料來源", "type": "source", "defval": "close", "isHidden": true},
			],
			// 設定中樣式tab內的設定
			styles: {
				plot_0:
				{
					title: '扣抵樣式',
					location: 'Bottom',
					size: 'tiny',	// auto, tiny, small, normal, large, huge
				},
				// isHidden: true 不在樣式tab中顯示
				sma_1:{title: '均線樣式1', isHidden: true},
				sma_2:{title: '均線樣式2', isHidden: true},
				sma_3:{title: '均線樣式3', isHidden: true},
				sma_4:{title: '均線樣式4', isHidden: true},
				sma_5:{title: '均線樣式5', isHidden: true},
            },
			// 設定中樣式tab內對映樣式設定的其他樣式
			palettes: {
				paletteId1: {
					// 對映索引表(對映colors)
					valToIndex: {
						0: 0,
						1: 1,
						2: 2,
						3: 3,
						4: 4,
					},
					colors: {
						0: {
							name: 'plot 1',
						},
						1: {
							name: 'plot 2',
						},
						2: {
							name: 'plot 3',
						},
						3: {
							name: 'plot 4',
						},
						4: {
							name: 'plot 5',
						},
					},
				},
			},
			description: 'MADeduct',
			shortDescription: '均線扣抵',
			is_price_study: true,
			id: 'MADeduct@tv-basicstudies-1',
			scriptIdPart: '',
			format: {
				type: 'inherit',
			},
			overlay: true,
		},
		constructor: function() {
			this.init = function(ctx, ipt) {
				this._context = ctx;
				this._input = ipt;
				// this.study_id = `MADeduct_${"".random()}`;
				console.log('[MADeduct]', 'init');
				// 定義商品代碼(透過PineJS取得)
				let symbol = PineJS.Std.ticker(this._context);
				// 建立新的商品資料源
				this._context.new_sym(symbol, PineJS.Std.period(this._context));
			}
			// 自制重畫處理
			this.redraw = function() {
				// 取widget的已啟用chart圖
				const mainChart = vue.$store.state.tvc.widget.activeChart();
				// 透過widget取出所有指標。
				let allStudies = mainChart.getAllStudies();
				// 過濾出所有均線扣抵的指標
				let sourceList = allStudies.filter(stu => stu.name === "MADeduct");
				// 延遲16ms執行重畫(立即執行會有錯誤(原因不明))
				setTimeout(() => {
					// 依照扣抵清單依次重畫
					for(let i in sourceList) {
						let id = sourceList[i].id;
						// 根據Study id取得指標物件
						let chartObj = mainChart.getStudyById(id);
						// 透過設定visible方式重畫
						chartObj.setVisible(false);
						chartObj.setVisible(true);
					}
				}, 16);
			}
			this.main = function(context, inputCallback) {
				this._context = context;
				this._input = inputCallback;
				let tickIndex = PineJS.Std.n(this._context) - 1;	// 減1是因為tvc會事先執行一次，當時的index為-1
				// console.log("[main console]", tickIndex);
				// 判斷是否為新的tick，是的話重畫該指標
				if(this._context.symbol.isLastBar && this.latestBarIndex !== tickIndex) {
					if(!this.latestBarIndex)
						this.latestBarIndex = tickIndex;
					else 
						this.redraw();
				}
				// 指定商品資料源的資料
				this._context.select_sym(1);
				let barsSets = this._context.symbol.script.runner.barsets[0];
				// 原始tick資料數量(含回補當下時間點)
				let bars_len = barsSets? barsSets.bars.length: 0;
				// 該tick是否可見
				let shouldBeShapeVisible = false;
				// 該tick顯示的樣式
				let patten = 0;
				// 扣抵1的值;
				let inputValue1 = this._input(0);
				let inputValue2 = this._input(1);
				let inputValue3 = this._input(2);
				let inputValue4 = this._input(3);
				let inputValue5 = this._input(4);
				// 當index大於0時判斷各扣抵的位置是否與index相等
				if(context.symbol && tickIndex > 0) {
					if(tickIndex == (bars_len - inputValue1)) {
						// 設定0時不處理==>不顯示
						if(inputValue1) {
							// 設定顯示
							shouldBeShapeVisible = true;
							// 設定樣式
							patten = 0;
						}
					}
					if(tickIndex == (bars_len - inputValue2)) {
						if(inputValue2) {
							shouldBeShapeVisible = true;
							patten = 1;
						}
					}
					if(tickIndex == (bars_len - inputValue3)) {
						if(inputValue3) {
							shouldBeShapeVisible = true;
							patten = 2;
						}
					}
					if(tickIndex == (bars_len - inputValue4)) {
						if(inputValue4) {
							shouldBeShapeVisible = true;
							patten = 3;
						}
					}
					if(tickIndex == (bars_len - inputValue5)) {
						if(inputValue5) {
							shouldBeShapeVisible = true;
							patten = 4;
						}
					}
				}
				// 取得數據(依設定的資料源欄位)==>這裡取close
				let c = PineJS.Std[this._input(5)](this._context);
				// 透過c的資料，建立新的資料源
				let source = this._context.new_var(c);
				// 計算指數移動平均
				// let ema = PineJS.Std.ema(source, inputValue1, this._context);
				// let emaSource = this._context.new_var(ema);
				// 計算各簡單移動平均價格
				let sma1 = PineJS.Std.sma(source, this._input(0), this._context);
				let sma2 = PineJS.Std.sma(source, this._input(1), this._context);
				let sma3 = PineJS.Std.sma(source, this._input(2), this._context);
				let sma4 = PineJS.Std.sma(source, this._input(3), this._context);
				let sma5 = PineJS.Std.sma(source, this._input(4), this._context);
				// let close = PineJS.Std.close(this._context);
				// 1 is plot value, it'll be displayed in legend of the indicator
				// NaN means that there is no value for that plot and shape should be hidden for that bar
				// 判斷顯示時，標示現價
				let plotValue = shouldBeShapeVisible ? close: NaN;
				// 回傳各均價、扣抵值、均價對映樣式代碼、扣抵對映樣式代碼
				return [sma1, sma2, sma3, sma4, sma5, plotValue, 0, 1, 2, 3, 4, patten];
			}
		}
	};
}
