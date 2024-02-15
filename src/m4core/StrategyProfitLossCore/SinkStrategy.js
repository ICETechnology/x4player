(function (root, Core, Interface, Deferred) {

	var k;
	var p;
	var q;
	var weight;

	/**
	 * 大跌策略(買進一個賣權)
	 */
	function SinkStrategy () {
		this.StrategyType = 'Single';
		this.StrategyName = 'Sink';
		this.rule = {
			// 單式=1, 複式=2
			ProductQty: 1,
			AskBid: 'Bid',
			CallPut: 'P'
		};

		this._info = {
			Title: '大跌',
			Content: '買入看跌期權。市場受到利空消息打擊或技術性轉空，預計後市還有一波不小的跌幅。',
			ImageClass: 'strategy-7-image'
		};

		this._dataready = false;
	}

	SinkStrategy.prototype = new Interface();

	/**
	 * 取得指定履約價格損益資料
	 * @param  {Number} strike 履約價格
	 * @return {ProfitPoint}
	 */
	SinkStrategy.prototype.getProfitPoint = function (strike) {
		var point = {
			strike: strike,
			profit: NaN
		};

		// PL = Q x MAX(X－S－p, －p) * w
		if (this._dataready) {
			var f = Math.max(k.minus(Big(strike)).minus(p) , -p);
			f = Big(f).times(weight);
			var profit = q.times(f);

			point.profit = +profit;
		}

		return point;
	};

	/**
	 * 更新大跌損益資料
	 * 最大可能獲利 (_profit)   ：無限
	 * 最大可能損失 (_loss)     ：Q * 支付的權利金 * 每點價值
	 * 損益平衡點   (_breakeven)：履約價 + 權利金
	 * 臨界點      (_criticalList) : 履約價
	 * @param  {Array<Number>} products 商品列表
	 */
	SinkStrategy.prototype.update = function(products) {
		

		// 資料準備就緒
		this._dataready = true;

		// 履約價(K)
		k = new Big(parseFloat(M4C.Option.getStrike(products[0].Symbol), 10));

		// 權利金
		p = new Big(parseFloat(products[0].Bid, 10));

		// 數量
		q = new Big(parseInt(products[0].Quantity, 10));

		// 每點價值
		try {
			weight = +(M4C.Symbol.getMainformInfo(products[0].Symbol).Weight) || 1;
		} catch (ex) {
			console.error(ex);
			weight = 1;
		}

		// 最大獲利 = 無限
		this._profit = [Number.POSITIVE_INFINITY];

		// 最大可能損失 = Q * 權利金 * 每點價值
		this._loss = [+ (q.times(p).times(-1)).times(weight)];

		// 損益兩平
		this._breakeven = [+ (k.minus(p))];

		// 臨界點
		this._criticalList = [{
			strike: +k,
			profit: this._loss[0]
		}];

		// 股價(S)
		var tcids = products[0].Symbol.split('.');
		this._step = M4C.Option.getCurStrikePriceStep();

	};

	/**
	 * 判斷自組商品是否符合大跌策略
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	SinkStrategy.prototype.matchStrategy = function(products) {
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
	Core.register(new SinkStrategy());

})(window, window.StrategyProfitLossCore, window.StrategyProfitLossCore.StrategyInterface);