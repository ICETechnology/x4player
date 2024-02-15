export function getBiasIndicator(PineJS) {
	return {
		name: "Bias",
		metainfo: {
			// 指標元數據的版本
			_metainfoVersion: 1,
			// 指標的唯一標識符
			id: "Bias@tv-basicstudies-1",
			// 腳本ID的一部分，通常在內部使用，可以將其保留為空字符串
			scriptIdPart: "",
			// 指標的全名。這將在指標列表中顯示給終端用戶
			name: "Bias",
			// 指標的描述。這將在指標的詳細信息中顯示給終端用戶。
			description: "Bias",
			// 指標的簡短描述。這將在指標列表中顯示給終端用戶。
			shortDescription: "Bias",
			// // 表示指標是否應該在指標列表中隱藏
			// is_hidden_study: false,
			// 表示指標是否基於價格數據 (設定為 true 時，會疊加在主圖上)
			is_price_study: false,
			// 表示指標是否為自定義指標
			isCustomIndicator: true,
			// isTVScript: false,
			// isTVScriptStub: false,
			// 指標的預設設定，例如繪圖樣式、精確度和輸入值
            defaults: {
				palettes: {
					paletteId1: {
						// 扣抵標示及文字顏色對映表
						colors: {
							0: {
								color: '#FF0000',
								width: 3, // 要有該欄位否則console會持續報錯，可改變線條寬度。
								style: 0, // 要有該欄位否則console會持續報錯，目前測試到可改變線條樣式。
							},
							1: {
								color: 'rgba(156,39,176,1)',
								width: 1,
								style: 0,
							},	
							2: {
								color: 'rgba(255,109,0,1)',
								width: 1,
								style: 0,
							},
							3: {
								color: 'rgba(67,160,71,1)',
								width: 1,
								style: 0,
							},
							4: {
								color: 'rgba(38,198,218,1)',
								width: 1,
								style: 0,
							},
							5: {
								color: 'rgba(245,0,87,1)',
								width: 1,
								style: 0,
							},						
						},
					},
				},
				styles: {
					// 0軸
					plot_0: {
						linestyle: 0,
						linewidth: 3,
						color: '#FF0000',	
					},
					// line樣式設定
					bias_1: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(156,39,176,1)',
					},	
					bias_2: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(255,109,0,1)',
					},
					bias_3: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(67,160,71,1)',
					},
					bias_4: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(38,198,218,1)',
					},
					bias_5: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(245,0,87,1)',
					},			
				},
				inputs: {
					"BiasPeriod1": 5,
					"BiasPeriod2": 10,
					"BiasPeriod3": 20,
					"BiasPeriod4": 0,
					"BiasPeriod5": 0,
				},
				precision: 2,
       		},
			// 包含指標繪圖設定的陣列
			plots: [
				{ id: "bias_1", type: "line" },
				{ id: "bias_2", type: "line" },
				{ id: "bias_3", type: "line" },
				{ id: "bias_4", type: "line" },
				{ id: "bias_5", type: "line" },
				{ id: "plot_0", type: "line" },
				// 目標(target)顯示樣式及id
				{
					id: 'ma_color1',
					type: 'colorer',
					target: 'plot_0',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color2',
					type: 'colorer',
					target: 'bias_1',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color2',
					type: 'colorer',
					target: 'bias_2',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color3',
					type: 'colorer',
					target: 'bias_3',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color4',
					type: 'colorer',
					target: 'bias_4',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color5',
					type: 'colorer',
					target: 'bias_5',
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
			// 指標的繪圖樣式設定，例如標題、直方圖基線
			styles: {
				plot_0: {
					title: "-- 0 軸 --",
					location: 'Bottom',
					size: 'tiny',	// auto, tiny, small, normal, large, huge
				},			
				bias_1: {
					title: '乖離率樣式1', 
					location: 'Bottom',
					size: 'tiny',	// auto, tiny, small, normal, large, huge
				}
			},
			// 包含指標輸入參數的陣列
			inputs: [
				{"id": "BiasPeriod1", "name": "乖離率週期1", "type": 'integer', "defval": 5, "min": 0},
				{"id": "BiasPeriod2", "name": "乖離率週期2", "type": 'integer', "defval": 10, "min": 0},
				{"id": "BiasPeriod3", "name": "乖離率週期3", "type": 'integer', "defval": 20, "min": 0},
				{"id": "BiasPeriod4", "name": "乖離率週期4", "type": 'integer', "defval": 0, "min": 0},
				{"id": "BiasPeriod5", "name": "乖離率週期5", "type": 'integer', "defval": 0, "min": 0},
			],
		},
		constructor: function() {
			this.init = function(ctx, ipt) {
				this._context = ctx;
				this._input = ipt;
				// this.study_id = `MADeduct_${"".random()}`;
				console.log('[Bias]', 'init');
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

		
				// 當前價格
				const c = PineJS.Std['close'](this._context);
				// 透過c的資料，建立新的資料源
				const source = this._context.new_var(c);
				// 計算簡單移動平均價格
				const sma1 = PineJS.Std.sma(source, this._input(0), this._context);
				const sma2 = PineJS.Std.sma(source, this._input(1), this._context);
				const sma3 = PineJS.Std.sma(source, this._input(2), this._context);
				const sma4 = PineJS.Std.sma(source, this._input(3), this._context);
				const sma5 = PineJS.Std.sma(source, this._input(4), this._context);

				// 計算bias 公式 （（目前價格 / n 移動平均價）/ n 移動平均價 ）*100 %
				const biasLine1 = (c-sma1)/sma1 * 100 ;
				const biasLine2 = (c-sma2)/sma2 * 100 ;
				const biasLine3 = (c-sma3)/sma3 * 100 ;
				const biasLine4 = (c-sma4)/sma4 * 100 ;
				const biasLine5 = (c-sma5)/sma5 * 100 ;


				// 回傳bias、0軸
				return [ biasLine1,biasLine2, biasLine3 ,biasLine4,biasLine5, 0 ];
			}
		}
	};
}


