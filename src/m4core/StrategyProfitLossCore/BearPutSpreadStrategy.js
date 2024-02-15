(function (root, Core, Interface, Deferred) {

	var k1, k2;
	var p1, p2;
	var q1, q2;
	var weight;

	/**
	 * 盤跌put(賣權空頭價差)策略(賣出低履約價的賣權、買進高履約價的賣權)
	 */
	function BearPutSpreadStrategy () {
		this.StrategyType = 'Double';
		this.StrategyName = 'BearPutSpread';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 2,
			AskBid: ['Ask', 'Bid'],
			CallPut: ['P', 'P']
		};

		this._info = {
			Title: '盤跌Put',
			Content: '買進高行權價的看跌期權和賣出低行權價的看跌期權，即熊市看跌期權垂直價差策略。預期標的物即將下跌，隱波率不高，買入看跌期權，但執行價格偏高，權利金貴，所以賣出看跌期權減少權利金支出。',
			ImageClass: 'strategy-13-image'
		};

		this._dataready = false;
	}

	BearPutSpreadStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	BearPutSpreadStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q1 x MIN(S－X1＋p1, p1) * weight + Q2 x MAX(X2－S－p2,－p2) * weight
		if (this._dataready) {
			var f1 = Math.min( Big(strike).minus(k1).plus(p1), p1 );
			var f2 = Math.max( k2.minus(Big(strike)).minus(p2) , -p2 );
			var profit = q1.times(f1).times(weight).plus(q2.times(f2).times(weight));

			point.profit = +profit;
		}

		return point;
	};

	/**
	 * 更新盤跌put(賣權空頭價差)損益資料
	 * 最大可能獲利 (_profit)   ：Q * [(高履約價-低履約價) -(買進賣權權利金-賣出賣權權利金)] * 每點價值
	 * 最大可能損失 (_loss)     ：Q * (買進賣權權利金 - 賣出賣權權利金) * 每點價值
	 * 損益平衡點   (_breakeven)：高履約價 - (買進賣權權利金點數-賣出賣權權利金點數)
	 * 臨界點      (_criticalList) : 低履約價, 高履約價
	 * @param  {Array<Number>} products 商品列表
	 */
	BearPutSpreadStrategy.prototype.update = function(products) {
		

		// 資料準備就緒
		this._dataready = true;

		// 依履約價排序(低 -> 高)
		products.sort(function(a, b){
			return M4C.Option.getStrike(a.Symbol) - M4C.Option.getStrike(b.Symbol);
		});

		// 低履約價商品
		var lowStrikeSymbol = products[0].Symbol;
		// 高履約價商品
		var highStrikeSymbol = products[1].Symbol;

		// 履約價(K)
		k1 = new Big(parseFloat(M4C.Option.getStrike(lowStrikeSymbol), 10));
		k2 = new Big(parseFloat(M4C.Option.getStrike(highStrikeSymbol), 10));

		// 權利金
		p1 = new Big(parseFloat(products[0].Ask, 10));
		p2 = new Big(parseFloat(products[1].Bid, 10));

		// 數量(q1 = q2)
		q1 = new Big(parseInt(products[0].Quantity, 10));
		q2 = new Big(parseInt(products[1].Quantity, 10));

		// 每點價值
		try {
			weight = +(M4C.Symbol.getMainformInfo(products[0].Symbol).Weight) || 1;
		} catch (ex) {
			console.error(ex);
			weight = 1;
		}

		// 最大可能獲利 = Q * [(高履約價-低履約價) -(買進賣權權利金-賣出賣權權利金)] * 每點價值
		var f1 = k2.minus(k1);
		var f2 = p2.minus(p1);
		var profit = f1.minus(f2).times(weight).times(q1);
		this._profit = [+ (profit)];

		// 最大可能損失 = Q * (買進賣權權利金 - 賣出賣權權利金) * 每點價值
		var loss = q2.times(p2.minus(p1).times(weight)).times(-1);
		this._loss = [+ (loss)];

		// 損益兩平 = 高履約價 - (買進賣權權利金點數-賣出賣權權利金點數)
		// 有損益兩平時前提 k1 - p1 <= k2 - p2 && p1 <= p2
		if (+k1.minus(p1) <= +k2.minus(p2) && +p1 <= +p2) {
			this._breakeven = [+ (k2.minus(p2.minus(p1)))];
		} else {
			this._breakeven = [];
		}

		// 臨界點
		this._criticalList = [{
			strike: +k1,
			profit: this._profit[0]
		}, {
			strike: +k2,
			profit: this._loss[0]
		}];

		// 股價(S)
		var tcids = lowStrikeSymbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合盤跌put(賣權空頭價差)策略
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	BearPutSpreadStrategy.prototype.matchStrategy = function(products) {
		this._matchStrategy = false;

		if (products.length < this.rule.ProductQty) {
			return this._matchStrategy;
		}

		// 依履約價排序(低 -> 高)
		products.sort(function(a, b){
			return M4C.Option.getStrike(a.Symbol) - M4C.Option.getStrike(b.Symbol);
		});

		var lastStrike;
		for (var i=0; i<products.length; i++) {
			// 盤跌put(賣權空頭價差)履約價不相同
			var strike = parseFloat(M4C.Option.getStrike(products[i].Symbol), 10);
			if (lastStrike && lastStrike === strike) {
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
	Core.register(new BearPutSpreadStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);