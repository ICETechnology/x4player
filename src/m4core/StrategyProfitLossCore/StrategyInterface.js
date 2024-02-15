(function(Core) {

	/**
	 * Product
	 * @property {String} Symbol 商品
	 * @property {Number} Ask 賣價
	 * @property {Number} Bid 買價
	 * @property {Number} Quantity 口數
	 */

	/**
	 * ProfitPoint
	 * @property {Number} profit 損益點
	 * @property {Number} strike 履約價
	 */


	/**
	 * 策略損益介面
	 */
	function StrategyInterface () {
		this._profit = [Number.POSITIVE_INFINITY];
		this._loss = [Number.NEGATIVE_INFINITY];
		this._step = 0;
		this._breakeven = [];
		this._criticalList = [];
		this._matchStrategy = false;
	}

	/**
	 * 更新數值
	 * @param  {Array<Product>} products 商品
	 * @return {Promise}
	 */
	StrategyInterface.prototype.update = function(product) {
		throw "Not implement";
	};

	/**
	 * 取得最大獲利
	 * @return {Array<Number>}
	 */
	StrategyInterface.prototype.getProfit = function() {
		return this._profit;
	};

	/**
	 * 取得最大損失
	 * @return {Array<Number>}
	 */
	StrategyInterface.prototype.getLoss = function() {
		return this._loss;
	};

	/**
	 * 取得損益兩平
	 * @return {Array<Number>}
	 */
	StrategyInterface.prototype.getBreakeven = function() {
		return this._breakeven;
	};

	/**
	 * 取得單筆損益資料
	 * @param  {Number} strike       履約價格
	 * @return {ProfitPoint}
	 */
	StrategyInterface.prototype.getProfitPoint = function (strike) {
		return {
			strike: strike,
			profit: NaN
		};
	};

	/**
	 * 取得臨界點列表
	 * @return {Array<Number>}
	 */
	StrategyInterface.prototype.getCriticalList = function() {
		return this._criticalList.map(function (point) {
			return point.strike;
		});
	};

	/**
	 * 取得臨界點損益資料列表
	 * @return {Array<ProfitPoint>}
	 */
	StrategyInterface.prototype.getCriticalPointList = function() {
		return this._criticalList;
	};

	/**
	 * 取得履約價格最佳步進值
	 * @return {Number}
	 */
	StrategyInterface.prototype.getStrikeStep = function() {
		return this._step;
	};

	/**
	 * 判斷自組商品是否符合該策略
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	StrategyInterface.prototype.matchStrategy = function(products) {
		return this._matchStrategy;
	};

	/**
	 * 取得模組資訊
	 * @return {Object}
	 */
	StrategyInterface.prototype.getInfo = function() {
		return this._info;
	};

	Core.StrategyInterface = StrategyInterface;

})(window.StrategyProfitLossCore);