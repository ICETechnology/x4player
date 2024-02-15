(function (root, Core, Interface, Deferred) {

	var k;
	var p1, p2;
	var q1, q2;

	/**
	 * 轉換策略(買進相同履約價賣權、賣出相同履約價買權)
	 */
	function ConversionsStrategy () {
		this.StrategyType = 'Double';
		this.StrategyName = 'Conversions';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 2,
			AskBid: ['Bid', 'Ask'],
			CallPut: ['P', 'C']
		};

		this._info = {
			Title: '轉換',
			Content: '買進看跌期權，同時賣出相同到期日且相同履約價之看漲期權，研判股市未來將呈大空頭走勢，而上漲的可能性微乎其微，然若市場走勢不如預期，風險無限，操作時應善設停損點位。',
			ImageClass: 'strategy-18-image'
		};

		this._dataready = false;
	}

	ConversionsStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	ConversionsStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q1 x MAX(X - S - p1, -p1) + Q2 x MIN(X - S + p2, p2)
		if (this._dataready) {
			var f1 = Math.max(k.minus(strike).minus(p1), -p1);
			var f2 = Math.min(k.minus(strike).plus(p2), p2);
			var profit = q1.times(f1).plus(q2.times(f2));

			point.profit = +profit;
		}

		return point;
	};

	/**
	 * 更新轉換策略損益資料
	 * 最大可能獲利 (_profit)   ：無限
	 * 最大可能損失 (_loss)     ：無限
	 * 損益平衡點   (_breakeven)：履約價 + 買權權利金點數 - 賣權權利金點數
	 * @param  {Array<Number>} products 商品列表
	 */
	ConversionsStrategy.prototype.update = function(products) {
		

		// 資料準備就緒
		this._dataready = true;

		// 依買賣權排序(賣 -> 買)
		products.sort(function(a, b){
			return M4C.Option.getCallPut(a.Symbol) < M4C.Option.getCallPut(b.Symbol);
		});

		// 商品
		var symbol = products[0].Symbol;

		// 履約價(K)
		k = new Big(parseFloat(M4C.Option.getStrike(symbol), 10));

		// 買進賣權權利金
		p1 = new Big(parseFloat(products[0].Bid, 10));

		// 賣出買權權利金
		p2 = new Big(parseFloat(products[1].Ask, 10));

		// 數量(q1 = q2)
		q1 = new Big(parseInt(products[0].Quantity, 10));
		q2 = new Big(parseInt(products[1].Quantity, 10));

		// 最大可能獲利 = 無限
		this._profit = [Number.POSITIVE_INFINITY];

		// 最大可能損失 = 無限
		this._loss = [Number.NEGATIVE_INFINITY];

		// 損益兩平 = 履約價 + 買權權利金點數 - 賣權權利金點數
		this._breakeven = [+ (k.plus(p2).minus(p1))];

		// 臨界點
		this._criticalList = [];

		// 股價(S)
		var tcids = symbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合轉換
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	ConversionsStrategy.prototype.matchStrategy = function(products) {
		this._matchStrategy = false;

		if (products.length < this.rule.ProductQty) {
			return this._matchStrategy;
		}

		// 依買賣權排序(賣 -> 買)
		products.sort(function(a, b){
			return M4C.Option.getCallPut(a.Symbol) < M4C.Option.getCallPut(b.Symbol);
		});

		var lastStrike;
		for (var i=0; i<products.length; i++) {
			// 轉換履約價相同
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
	Core.register(new ConversionsStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);