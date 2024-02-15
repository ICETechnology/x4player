(function (root, Core, Interface, Deferred) {

	var k1, k2;
	var p1, p2;
	var q1, q2;
	var weight;

	/**
	 * 區間盤整(賣出勒式)策略(賣出低履約價賣權、賣出高履約價的買權)
	 */
	function SellStranglesStrategy () {
		this.StrategyType = 'Double';
		this.StrategyName = 'SellStrangles';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 2,
			AskBid: ['Ask', 'Ask'],
			CallPut: ['C', 'P']
		};

		this._info = {
			Title: '區間盤整',
			Content: '同時賣出看漲期權和看跌期權，即賣出寬跨式策略。當前無法判斷標的物價格變動方向，但價格趨於盤整，波幅收窄，波動率下降。到達盈虧平衡點慢，適合供需平衡，政策信息相對真空期。',
			ImageClass: 'strategy-17-image'
		};

		this._dataready = false;
	}

	SellStranglesStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	SellStranglesStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q1 x MIN(X1－S＋p1, p1) * weight + Q2 x MIN(S－X2＋p2, p2) * weight
		if (this._dataready) {
			var f1 = Math.min(k1.minus(Big(strike)).plus(p1), p1);
			var f2 = Math.min(Big(strike).minus(k2).plus(p2), p2);
			var profit = q1.times(f1).times(weight).plus(q2.times(f2).times(weight));

			point.profit = +profit;
		}

		return point;
	};

	/**
	 * 更新區間盤整(賣出勒式)損益資料
	 * 最大可能獲利 (_profit)   ：Q * (賣出call權利金 + 賣出put權利金) * 每點價值
	 * 最大可能損失 (_loss)     ：無限
	 * 損益平衡點   (_breakeven)：高履約價 + (賣出call權利金點數 + 賣出put權利金點數) 或 低履約價 - (賣出call權利金點數+賣出put權利金點數)
	 * 臨界點      (_criticalList) : 低履約價, 高履約價
	 * @param  {Array<Number>} products 商品列表
	 */
	SellStranglesStrategy.prototype.update = function(products, multiOrder) {
		

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
		p1 = new Big(parseFloat(products[0].Ask, 10));
		p2 = new Big(parseFloat(products[1].Ask, 10));

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


		// 最大可能獲利 = Q * (賣出call權利金 + 賣出put權利金) * 每點價值
		this._profit = [+ (q1.times(p1PlusP2.times(weight)))];

		// 最大可能損失 = 無限
		this._loss = [Number.NEGATIVE_INFINITY];

		// 損益兩平 = 高履約價 + (賣出call權利金點數 + 賣出put權利金點數) 或 低履約價 - (賣出call權利金點數+賣出put權利金點數)
		this._breakeven = [
			+ (k1.plus(p1PlusP2)),
			+ (k2.minus(p1PlusP2))
		];
		this._breakeven.sort();

		// 臨界點
		this._criticalList = [{
			strike: +k1,
			profit: this._profit[0]
		}, {
			strike: +k2,
			profit: this._profit[0]
		}];

		// 更新履約價格步進值
		var tcids = lowStrikeSymbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合區間盤整(賣出勒式)策略
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	SellStranglesStrategy.prototype.matchStrategy = function(products) {
		this._matchStrategy = false;

		if (products.length < this.rule.ProductQty) {
			return this._matchStrategy;
		}

		// 依履約價排序(高 -> 低)
		products.sort(function(a, b){
			return M4C.Option.getStrike(b.Symbol) - M4C.Option.getStrike(a.Symbol);
		});

		var lastStrike;
		for (var i=0; i<products.length; i++) {
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
	Core.register(new SellStranglesStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);