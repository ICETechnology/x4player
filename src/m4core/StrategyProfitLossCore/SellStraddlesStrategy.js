(function (root, Core, Interface, Deferred) {

	var k;
	var p1, p2;
	var q1, q2;
	var weight;

	/**
	 * 原點盤整(賣出跨式)策略(賣出相同履約價的買權跟賣權)
	 */
	function SellStraddlesStrategy () {
		this.StrategyType = 'Double';
		this.StrategyName = 'SellStraddles';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 2,
			AskBid: ['Ask', 'Ask'],
			CallPut: ['C', 'P']
		};

		this._info = {
			Title: '原點盤整',
			Content: '同時賣出相同數量、到期日、行權價的看漲和看跌期權，即賣出跨式策略。使用時機在於預期期權標的在行權日前不會有重大價格變動，處盤整格局時所採用。賣出跨式策略常見於市場將揭曉重大事件，但明朗化時間在行權日之後，研判在該日期之前屬盤整待變，或研判市場上有套牢賣壓，下有強力支撐時採用。該原點突破策略最大獲利有限，最多就是賣出看漲及看跌權所收取的權利金，但風險無限，操作時應善設停損點位。',
			ImageClass: 'strategy-15-image'
		};

		this._dataready = false;
	}

	SellStraddlesStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	SellStraddlesStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q1 x MIN(X－S＋p1, p1) * weight + Q2 x MIN(S－X＋p2, p2) * weight
		if (this._dataready) {
			var f1 = Math.min(k.minus(Big(strike)).plus(p1), p1);
			var f2 = Math.min(Big(strike).minus(k).plus(p2), p2);
			var profit = q1.times(f1).times(weight).plus(q2.times(f2).times(weight));

			point.profit = +profit;
		}

		return point;
	};

	/**
	 * 更新原點盤整(賣出跨式)損益資料
	 * 最大可能獲利 (_profit)   ：Q * (賣出買權權利金 + 賣出賣權權利金) * 每點價值
	 * 最大可能損失 (_loss)     ：無限
	 * 損益平衡點   (_breakeven)：履約價 + (賣出買權權利金點數 + 賣出賣權權利金點數) 或 履約價 - (賣出買權權利金點數 + 賣出賣權權利金點數)
	 * 臨界點      (_criticalList) : 履約價
	 * @param  {Array<Number>} products 商品列表
	 */
	SellStraddlesStrategy.prototype.update = function(products, multiOrder) {
		

		// 資料準備就緒
		this._dataready = true;

		// 依買賣權排序(賣 -> 買)
		products.sort(function(a, b){
			return M4C.Option.getCallPut(a.Symbol) > M4C.Option.getCallPut(b.Symbol);
		});

		// 商品
		var symbol = products[0].Symbol;

		// 履約價(K)
		k = new Big(parseFloat(M4C.Option.getStrike(symbol), 10));

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

		// 最大可能獲利 = Q * (賣出買權權利金 + 賣出賣權權利金)
		this._profit = [+ (q1.times(p1PlusP2.times(weight)))];

		// 最大可能損失 = 無限
		this._loss = [Number.NEGATIVE_INFINITY];

		// 損益兩平 = 履約價 + (賣出買權權利金點數 + 賣出賣權權利金點數) 或 履約價 - (賣出買權權利金點數 + 賣出賣權權利金點數)
		this._breakeven = [
			+ (k.plus(p1PlusP2)),
			+ (k.minus(p1PlusP2))
		];
		this._breakeven.sort();

		// 臨界點
		this._criticalList = [{
			strike: +k,
			profit: this._profit[0]
		}];

		// 股價(S)
		var tcids = symbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合原點盤整(賣出跨式)
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	SellStraddlesStrategy.prototype.matchStrategy = function(products) {
		this._matchStrategy = false;

		if (products.length < this.rule.ProductQty) {
			return this._matchStrategy;
		}

		// 依買賣權排序(賣 -> 買)
		products.sort(function(a, b){
			return M4C.Option.getCallPut(a.Symbol) > M4C.Option.getCallPut(b.Symbol);
		});

		var lastStrike;
		for (var i = 0; i < products.length; i++) {
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
	Core.register(new SellStraddlesStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);