(function (root, Core, Interface, Deferred) {

	var k;
	var p;
	var q;
	var weight;

	/**
	 * 不漲策略(賣出一個買權)
	 */
	function NotRiseStrategy () {
		this.StrategyType = 'Single';
		this.StrategyName = 'NotRise';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 1,
			AskBid: 'Ask',
			CallPut: 'C'
		};

		this._info = {
			Title: '不漲',
			Content: '賣出看漲期權。標的物價格經過一段上漲面臨前期高點或技術阻力位，預期後市轉空或者進行調整。',
			ImageClass: 'strategy-9-image'
		};

		this._dataready = false;
	}

	NotRiseStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	NotRiseStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q x MIN(X－S＋p, p) * w
		if (this._dataready) {
			var f = Math.min(k.minus(Big(strike)).plus(p), p);
			f = Big(f).times(weight);
			var profit = q.times(f);

			point.profit = +profit;
		}

		return point;
	};

	/**
	 * 更新不漲損益資料
	 * 最大可能獲利 (_profit)   ：Q * 收取之權利金 * 每點價值
	 * 最大可能損失 (_loss)     ：無限
	 * 損益平衡點   (_breakeven)：履約價 + 權利金點數
	 * 臨界點      (_criticalList) : 履約價
	 * @param  {Array<Number>} products 商品列表
	 */
	NotRiseStrategy.prototype.update = function(products) {
		

		// 資料準備就緒
		this._dataready = true;

		// 履約價(K)
		k = new Big(parseFloat(M4C.Option.getStrike(products[0].Symbol), 10));

		// 權利金
		p = new Big(parseFloat(products[0].Ask, 10));

		// 數量
		q = new Big(parseInt(products[0].Quantity, 10));

		// 每點價值
		try {
			weight = +(M4C.Symbol.getMainformInfo(products[0].Symbol).Weight) || 1;
		} catch (ex) {
			console.error(ex);
			weight = 1;
		}

		// 最大可能獲利 = Q * 權利金 * 每點價值
		this._profit = [+ (q.times(p).times(weight))];

		// 最大可能損失 = 無限
		this._loss = [Number.NEGATIVE_INFINITY];

		// 損益兩平
		this._breakeven = [+ (k.plus(p))];

		// 臨界點
		this._criticalList = [{
			strike: +k,
			profit: this._profit[0]
		}];

		// 股價(S)
		var tcids = products[0].Symbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合不漲策略
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	NotRiseStrategy.prototype.matchStrategy = function(products) {
		this._matchStrategy = false;

		if (products.length > this.rule.ProductQty) {
			return this._matchStrategy;
		}

		var symbol = products[0].Symbol;
		var callPut = M4C.Option.getCallPut(symbol);

		if ((callPut !== this.rule.CallPut) || (!products[0][this.rule.AskBid])) {
			return this._matchStrategy;
		}

		return (this._matchStrategy = true);
	};

	// 註冊策略模組
	Core.register(new NotRiseStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);