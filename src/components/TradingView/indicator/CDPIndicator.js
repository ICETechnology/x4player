export function getCDPIndicator(PineJS) {
	return {
		name: "CDP",
		metainfo: {
			// 指標元數據的版本
			_metainfoVersion: 1,
			// 指標的唯一標識符
			id: "CDP@tv-basicstudies-1",
			// 腳本ID的一部分，通常在內部使用，可以將其保留為空字符串
			scriptIdPart: "",
			// 指標的全名。這將在指標列表中顯示給終端用戶
			name: "CDP",
			// 指標的描述。這將在指標的詳細信息中顯示給終端用戶。
			description: "CDP",
			// 指標的簡短描述。這將在指標列表中顯示給終端用戶。
			shortDescription: "CDP",
			// // 表示指標是否應該在指標列表中隱藏
			// is_hidden_study: false,
			// 表示指標是否基於價格數據 (設定為 true 時，會疊加在主圖上)
			is_price_study: true,
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
							1: {
								color: 'rgba(191,52,250,1)', // purple
								width: 1,
								style: 0,
							},	
							2: {
								color: 'rgba(38,100,218,1)', // blue
								width: 1,
								style: 0,
							},
							3: {
								color: 'rgba(252,231,91,1)', // yellow
								width: 1,
								style: 0,
							},
							4: {
								color: 'rgba(67,160,71,1)', // green
								width: 1,
								style: 0,
							},
							5: {
								color: 'rgba(245,0,87,1)', // red
								width: 1,
								style: 0,
							},						
						},
					},
				},
				styles: {
					// line樣式設定
					CDP_1: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(191,52,250,1)', // purple
					},	
					CDP_2: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(38,100,218,1)', // blue
					},
					CDP_3: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(252,231,91,1)', // yellow
					},
					CDP_4: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(67,160,71,1)', // green
					},
					CDP_5: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgba(245,0,87,1)', // red
					},			
				},
				inputs: {},
				precision: 2,
       		},
			// 包含指標繪圖設定的陣列
			plots: [
				{ id: "CDP_1", type: "line" },
				{ id: "CDP_2", type: "line" },
				{ id: "CDP_3", type: "line" },
				{ id: "CDP_4", type: "line" },
				{ id: "CDP_5", type: "line" },
				// 目標(target)顯示樣式及id
				{
					id: 'ma_color2',
					type: 'colorer',
					target: 'CDP_1',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color2',
					type: 'colorer',
					target: 'CDP_2',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color3',
					type: 'colorer',
					target: 'CDP_3',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color4',
					type: 'colorer',
					target: 'CDP_4',
					palette: 'paletteId1',
				},
				{
					id: 'ma_color5',
					type: 'colorer',
					target: 'CDP_5',
					palette: 'paletteId1',
				},
			],
			// 指標的繪圖樣式設定，例如標題、直方圖基線
			styles: {
				CDP_1: {
					title: 'AH', 
					location: 'Bottom',
					size: 'tiny',	// auto, tiny, small, normal, large, huge
				},
				CDP_2: {
					title: 'NH', 
					location: 'Bottom',
					size: 'tiny',
				},
				CDP_3: {
					title: 'CDP', 
					location: 'Bottom',
					size: 'tiny',
				},
				CDP_4: {
					title: 'NL', 
					location: 'Bottom',
					size: 'tiny',
				},
				CDP_5: {
					title: 'AL', 
					location: 'Bottom',
					size: 'tiny',
				},
			},
			// 包含指標輸入參數的陣列
			inputs: [],
		},
		constructor: function() {
			this.init = function(ctx, ipt) {
				this._context = ctx;
				this._input = ipt;
				console.log('[CDP]', 'init');
				// 定義商品代碼(透過PineJS取得)
				let symbol = PineJS.Std.ticker(this._context);
				// 建立新的商品資料源
				this._context.new_sym(symbol, PineJS.Std.period(this._context));
			}
			this.main = function(context, inputCallback) {
				this._context = context;
				this._input = inputCallback;
				
				// 指定商品資料源的資料
				this._context.select_sym(1);

				// 取得數據(close、open、low、high)
				// var o = PineJS.Std.open(this._context);
				var c = PineJS.Std.close(this._context);
				var l = PineJS.Std.low(this._context);
				var h = PineJS.Std.high(this._context);
				// 計算 5 個指標
				let cdp = (window.prevH + window.prevL + 2 * window.prevC)/4;
				let ah = cdp + (window.prevH - window.prevL);
				let nh = 2 * cdp - window.prevL;
				let nl = 2 * cdp - window.prevH;
				let al = cdp - (window.prevH - window.prevL);
				// 將現在 K 棒 C、H、L 值存起來給下一根計算用
				window.prevC = c;
				window.prevH = h;
				window.prevL = l;

				// 回傳指標
				return [ah, nh, cdp, nl, al];

			}
		}
	};
}