(function (root, Core, Interface, Deferred) {

	var k;
	var p1, p2;
	var q1, q2;
	var weight;

	/**
	 * 原點突破(買進跨式)策略(買進相同履約價的買權跟賣權)
	 */
	function BuyStraddlesStrategy () {
		this.StrategyType = 'Double';
		this.StrategyName = 'BuyStraddles';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 2,
			AskBid: ['Bid', 'Bid'],
			CallPut: ['C', 'P']
		};

		this._info = {
			Title: '原點突破',
			Content: '同時買進看漲和看跌期權，即買入跨式策略。當前價格趨勢不明，波動率低，預期會有明顯價格突破，後市波動率越大對頭寸越有利，適合於預期盤整突破或者重大宏觀數據和事件發生前。',
			ImageClass: 'strategy-14-image'
		};

		this._dataready = false;
	}

	BuyStraddlesStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	BuyStraddlesStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q1 x MAX(S－X－p1,－p1) * weight + Q2 x MAX(X－S－p2,－p2) * weight
		if (this._dataready) {
			var f1 = Math.max(Big(strike).minus(k).minus(p1), -p1);
			var f2 = Math.max(k.minus(Big(strike)).minus(p2), -p2);
			var profit = q1.times(f1).times(weight).plus(q2.times(f2).times(weight));

			point.profit = +profit;
		}

		return point;
	};

	/**
	 * 更新原點突破(買進跨式)損益資料
	 * 最大可能獲利 (_profit)   ：無限
	 * 最大可能損失 (_loss)     ：Q * (買進買權權利金 + 買進賣權權利金) * 每點價值
	 * 損益平衡點   (_breakeven)：履約價 + (買進買權權利金點數+買進賣權權利金點數) 或履約價 - (買進買權權利金點數+買進賣權權利金點數)
	 * 臨界點      (_criticalList) : 履約價
	 * @param  {Array<Number>} products 商品列表
	 * @param {Object} multiOrder 組合單物件
	 */
	BuyStraddlesStrategy.prototype.update = function(products, multiOrder) {
		

		// 資料準備就緒
		this._dataready = true;

		// 依買賣權排序
		products.sort(function(a, b){
			return M4C.Option.getCallPut(a.Symbol) > M4C.Option.getCallPut(b.Symbol);
		});

		// 商品
		var symbol = products[0].Symbol;

		// 履約價(K)
		k = new Big(parseFloat(M4C.Option.getStrike(symbol), 10));

		// 權利金
		p1 = new Big(parseFloat(products[0].Bid, 10));
		p2 = new Big(parseFloat(products[1].Bid, 10));

		// 數量(q1 = q2)
		q1 = new Big(parseInt(products[0].Quantity, 10));
		q2 = new Big(parseInt(products[1].Quantity, 10));

		var p1PlusP2 = p1.plus(p2);

		// 每點價值
		try {
			weight = +(M4C.Symbol.getMainformInfo(products[0].Symbol).Weight) || 1;
		} catch (ex) {
			console.error(ex);
			weight = 1;
		}

		// 若為組合單，則使用組合單價格
		if (multiOrder && typeof multiOrder === 'object') {
			p1PlusP2 = new Big(parseFloat(multiOrder.price));
		}

		// 最大可能獲利 = 無限
		this._profit = [Number.POSITIVE_INFINITY];

		// 最大可能損失 = Q * (買進買權權利金 + 買進賣權權利金) * 每點價值
		var loss = q1.times(p1PlusP2.times(weight)).times(-1);
		this._loss = [+ (loss)];


		// 損益兩平 = 履約價 + (買進買權權利金 + 買進賣權權利金) 或 履約價 - (買進買權權利金+買進賣權權利金)
		this._breakeven = [
			+ (k.plus(p1PlusP2)),
			+ (k.minus(p1PlusP2))
		];
		this._breakeven.sort();

		// 臨界點
		this._criticalList = [{
			strike: +k,
			profit: this._loss[0]
		}];

		// 股價(S)
		var tcids = symbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合原點突破(買進跨式)
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	BuyStraddlesStrategy.prototype.matchStrategy = function(products) {
		this._matchStrategy = false;

		if (products.length < this.rule.ProductQty) {
			return this._matchStrategy;
		}

		var lastStrike;
		for (var i=0; i<products.length; i++) {
			// 跨式履約價相同
			var strike = parseFloat(M4C.Option.getStrike(products[i].Symbol), 10);
			if (lastStrike && lastStrike !== strike) {
				return this._matchStrategy;
			}

			var callPut = M4C.Option.getCallPut(products[i].Symbol);
			if (callPut !== this.rule.CallPut[i]) {
				return this._matchStrategy;
			}

			if (!products[i][this.rule.AskBid[i]]) {
				return this._matchStrategy;
			}

			lastStrike = strike;
		}

		return (this._matchStrategy = true);
	};

	// 註冊策略模組
	Core.register(new BuyStraddlesStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);