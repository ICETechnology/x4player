(function(root, xv) {

	/**
	 * ProfitPoint
	 * @property {Number} profit 損益點
	 * @property {Number} strike 履約價
	 */

	var _strategyMap = {};


	/**
	 * 策略損益核心
	 */
	function StrategyProfitLossCore() {
		var self = this;
	}
	StrategyProfitLossCore.prototype.init = function() {
		// 依策略更新損益資料
		M4C.on("UpdateStrategy", function(data) {
			try {
				var instance = self._getStrategyInstance(data.StrategyName);
				M4C.trigger("StrategyWillUpdate", {
					'StrategyName': data.StrategyName
				});

				instance.update(data.Products, data.multiOrder)
					.then(function() {
						M4C.trigger("StrategyUpdated", {
							StrategyName: data.StrategyName
						});
					}, function(reason) {
						M4C.trigger("StrategyUpdateFail", {
							StrategyName: data.StrategyName,
							Reason: reason
						});
					});
			} catch (ex) {
				M4C.trigger("StrategyNotFound", {
					'StrategyName': data.StrategyName
				});
			}
		});
	};

	/**
	 * 註冊策略元件
	 * @param  {StrategyInterface} strategy
	 * @return null
	 */
	StrategyProfitLossCore.prototype.register = function(strategyModule) {
		_strategyMap[strategyModule.StrategyName] = strategyModule;
	};

	/**
	 * 取得策略module
	 * @param  {String} strategyName 策略名稱
	 * @return {StrategyInterface}
	 */
	StrategyProfitLossCore.prototype._getStrategyInstance = function (strategyName) {
		if (_strategyMap[strategyName]) {
			return _strategyMap[strategyName];
		}
		// throw "Strategy not fund";
	};

	/**
	 * 取得最大獲利
	 * @param  {String} strategyName 策略名稱
	 * @return {Array<Number>}
	 */
	StrategyProfitLossCore.prototype.getProfit = function (strategyName) {
		return this._getStrategyInstance(strategyName).getProfit();
	};

	/**
	 * 取得最大損失
	 * @param  {String} strategyName 策略名稱
	 * @return {Array<Number>}
	 */
	StrategyProfitLossCore.prototype.getLoss = function (strategyName) {
		return this._getStrategyInstance(strategyName).getLoss();
	};

	/**
	 * 取得損益兩平
	 * @param  {String} strategyName 策略名稱
	 * @return {Array<Number>}
	 */
	StrategyProfitLossCore.prototype.getBreakeven = function (strategyName) {
		return this._getStrategyInstance(strategyName).getBreakeven();
	};

	/**
	 * 取得單筆損益資料
	 * @param  {String} strategyName 策略名稱
	 * @param  {Number} strike       履約價格
	 * @return {ProfitPoint}
	 */
	StrategyProfitLossCore.prototype.getProfitPoint = function (strategyName, strike) {
		return this._getStrategyInstance(strategyName).getProfitPoint(strike);
	};

	/**
	 * 取得損益資料
	 * @param  {String} strategyName 策略名稱
	 * @return {Array<ProfitPoint>}
	 */
	StrategyProfitLossCore.prototype.getProfitPointList = function (strategyName) {
		return this._getStrategyInstance(strategyName).getProfitPointList();
	};

	/**
	 * 判斷自組商品是否符合該策略
	 * @param  {String} strategyName 策略名稱
	 * @param  {Array<Product>} products 商品
	 * @return {Boolean}
	 */
	StrategyProfitLossCore.prototype.matchStrategy = function(strategyName, products) {
		return this._getStrategyInstance(strategyName).matchStrategy(products);
	};

	/**
	 * 取得臨界點列表
	 * @param  {String} strategyName 策略名稱
	 * @return {Array<Number>}
	 */
	StrategyProfitLossCore.prototype.getCriticalList = function(strategyName) {
		return this._getStrategyInstance(strategyName).getCriticalList();
	};

	/**
	 * 取得臨界點損益資料列表
	 * @param  {String} strategyName 策略名稱
	 * @return {Array<ProfitPoint>}
	 */
	StrategyProfitLossCore.prototype.getCriticalPointList = function(strategyName) {
		return this._getStrategyInstance(strategyName).getCriticalPointList();
	};

	/**
	 * 取得履約價格步進值
	 * @param  {String} strategyName 策略名稱
	 * @return {Number}
	 */
	StrategyProfitLossCore.prototype.getStrikeStep = function(strategyName) {
		return this._getStrategyInstance(strategyName).getStrikeStep();
	};

	/**
	 * 取得模組資訊
	 * @param  {String} strategyName 策略名稱
	 * @return {Object}
	 */
	StrategyProfitLossCore.prototype.getInfo = function(strategyName) {
		return this._getStrategyInstance(strategyName).getInfo();
	};

	StrategyProfitLossCore.prototype.calc = function(data) {
		var instance = this._getStrategyInstance(data.StrategyName);
		instance.update(data.Products, data.multiOrder);
		return {
			_profit: instance._profit,
			_loss: instance._loss,
			_breakeven: instance._breakeven,
		}
	};

	root.StrategyProfitLossCore = new StrategyProfitLossCore();

})(window);