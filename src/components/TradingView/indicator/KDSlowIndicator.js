export function getKDSlowIndicator(PineJS) {
	return {
		name: "KDSlow",
		metainfo: {
			// 指標元數據的版本
			_metainfoVersion: 1,
			// 指標的唯一標識符
			id: "KDSlow@tv-basicstudies-1",
			// 腳本ID的一部分，通常在內部使用，可以將其保留為空字符串
			scriptIdPart: "",
			// 指標的全名。這將在指標列表中顯示給終端用戶
			name: "KDSlow",
			// 指標的描述。這將在指標的詳細信息中顯示給終端用戶。
			description: "KDSlow",
			// 指標的簡短描述。這將在指標列表中顯示給終端用戶。
			shortDescription: "KD Slow",
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
				styles: {
					// line樣式設定
					K_line: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgb(33, 150, 243)',
					},	
					D_line: {
						linestyle: 0,
						linewidth: 1,
						color: 'rgb(255,109,0)',
					}
				},
				inputs: {
					"KPeriod": 9,
					"KSlow": 3,
					"DPeriod": 5
				},
				precision: 2,
       		},
			// 包含指標繪圖設定的陣列
			plots: [
				{ id: "K_line", type: "line" },
				{ id: "D_line", type: "line" },
			],
			// 指標的繪圖樣式設定，例如標題、直方圖基線
			styles: {
				K_line: {
					title: "K",
					location: 'Bottom',
					size: 'tiny',	// auto, tiny, small, normal, large, huge
				},			
				D_line: {
					title: 'D', 
					location: 'Bottom',
					size: 'tiny',	// auto, tiny, small, normal, large, huge
				},
			},
			// 包含指標輸入參數的陣列
			inputs: [
				{"id": "KPeriod", "name": "K週期", "type": 'integer', "defval": 9, "min": 0},
				{"id": "KSlow", "name": "K漸緩", "type": 'integer', "defval": 3, "min": 0},
				{"id": "DPeriod", "name": "D週期", "type": 'integer', "defval": 5, "min": 0},
			],
		},
		constructor: function() {
			this.init = function(ctx, ipt) {
				this._context = ctx;
				this._input = ipt;
				console.log('[KDSlow]', 'init');
				// 定義商品代碼(透過PineJS取得)
				let symbol = PineJS.Std.ticker(this._context);
				// 建立新的商品資料源
				this._context.new_sym(symbol, PineJS.Std.period(this._context));
				// 期初：K= 50，D= 50
				this.LastK = 50;
				this.LastD = 50;
			}
			
			this.main = function(context, inputCallback) {
				this._context = context;
				this._input = inputCallback;
				let tickIndex = PineJS.Std.n(this._context) - 1;	// 減1是因為tvc會事先執行一次，當時的index為-1

				// 指定商品資料源的資料
				this._context.select_sym(1);		
				// 最高價
				const h = PineJS.Std['high'](this._context);
				const highSource = this._context.new_var(h);
				// 最低價
				const l = PineJS.Std['low'](this._context);
				const lowSource = this._context.new_var(l);
				// 當前價格
				const c = PineJS.Std['close'](this._context);
				const source = this._context.new_var(c);
				// RSV = ( 收盤 – n日內的最低 ) / ( n日內的最高 – n日內的最低 ) * 100
				const RSV = PineJS.Std.stoch(source, highSource, lowSource, this._input(0), this._context);				

				let K, D;

				// 在RSV有值的前一項，讓K，D初始值為50，
				if(tickIndex==this._input(0) - 2){
					K = this.LastK;
					D = this.LastD;
				}else if(tickIndex >= this._input(0) - 1){
					K = ( this.LastK * (this._input(1) -1) + RSV ) / this._input(1);
					D = ( this.LastD * (this._input(2) -1) + K ) / this._input(2);
					this.LastK = K;
					this.LastD = D;
				}

				return [K , D];
			}
		}
	};
}


