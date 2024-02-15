(function (root, Core, Interface, Deferred) {

	var k1, k2;
	var p1, p2;
	var q1, q2;
	var weight;

	/**
	 * 區間突破(買進勒式)策略(買進低履約價賣權、買進高履約價的買權)
	 */
	function BuyStranglesStrategy () {
		this.StrategyType = 'Double';
		this.StrategyName = 'BuyStrangles';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 2,
			AskBid: ['Bid', 'Bid'],
			CallPut: ['C', 'P']
		};

		this._info = {
			Title: '區間突破',
			Content: '同時買進相同數量、相同到期日，但行權價不同的看漲和看跌期權（通常看漲期權的行權價大於現貨價，看跌期權的行權價小於現貨價），即買入勒式策略。區間突破和原點突破的買進跨式交易策略相似，預期標的物價格在到期日前會有重大的變化，不是大漲、就是大跌。不同的地方在於買進勒式交易策略所買進的期權通常為虛值，因此採用區間突破的交易策略成本比較便宜，交易風險較低，但相對的，價格必須有更大的波動，買進勒式策略才會獲利。',
			ImageClass: 'strategy-16-image'
		};

		this._dataready = false;
	}

	BuyStranglesStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	BuyStranglesStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q1 x MAX(S－X1－p1,－p1) * weight + Q2 x MAX(X2－S－p2,－p2) * weight
		if (this._dataready) {
			var f1 = Math.max(Big(strike).minus(k1).minus(p1), -p1);
			var f2 = Math.max(k2.minus(Big(strike)).minus(p2) , -p2);
			var profit = q1.times(f1).times(weight).plus(q2.times(f2).times(weight));

			point.profit = +(profit);
		}

		return point;
	};

	/**
	 * 更新區間突破(買進勒式)損益資料
	 * 最大可能獲利 (_profit)   ：無限
	 * 最大可能損失 (_loss)     ：Q * (買進買權權利金+買進賣權權利金) * 每點價值
	 * 損益平衡點   (_breakeven)：高履約價+（買進買權權利金點數+買進賣權權利金點數）或 低履約價-（買進買權權利金點數+買進賣權權利金點數）
	 * 臨界點      (_criticalList) : 低履約價, 高履約價
	 * @param  {Array<Number>} products 商品列表
	 * @param {Object} multiOrder 組合單物件
	 */
	BuyStranglesStrategy.prototype.update = function(products, multiOrder) {
		

		// 資料準備就緒
		this._dataready = true;

		// 依履約價排序(高 -> 低)
		products.sort(function(a, b){
			return M4C.Option.getStrike(b.Symbol) - M4C.Option.getStrike(a.Symbol);
		});

		// 低履約價商品
		var lowStrikeSymbol = products[0].Symbol;
		// 高履約價商品
		var highStrikeSymbol = products[1].Symbol;

		// 履約價(K)
		k1 = new Big(parseFloat(M4C.Option.getStrike(lowStrikeSymbol), 10));
		k2 = new Big(parseFloat(M4C.Option.getStrike(highStrikeSymbol), 10));

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

		// 最大可能損失 = Q * ( 買進買權權利金 + 買進賣權權利金) * 每點價值
		var loss = q1.times(p1PlusP2.times(weight)).times(-1);
		this._loss = [+ (loss)];

		// 損益兩平 = 高履約價 + (買進買權權利金點數 + 買進賣權權利金點數) 或 低履約價 - (買進買權權利金點數 + 買進賣權權利金點數)
		this._breakeven = [
			+ (k1.plus(p1PlusP2)),
			+ (k2.minus(p1PlusP2))
		];
		this._breakeven.sort();

		// 臨界點
		this._criticalList = [{
			strike: +k1,
			profit: this._loss[0]
		}, {
			strike: +k2,
			profit: this._loss[0]
		}];

		// 股價(S)
		var tcids = lowStrikeSymbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合區間突破(買進勒式)
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	BuyStranglesStrategy.prototype.matchStrategy = function(products) {
		this._matchStrategy = false;

		if (products.length < this.rule.ProductQty) {
			return this._matchStrategy;
		}

		// 依履約價排序(高 -> 低)
		products.sort(function(a, b){
			return M4C.Option.getStrike(b.Symbol) - M4C.Option.getStrike(a.Symbol);
		});

		var lastStrike;
		for (var i = 0; i < products.length; i++) {
			// 勒式履約價不相同
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
	Core.register(new BuyStranglesStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);