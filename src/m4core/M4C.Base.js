export default {
	data: function () {
		return {
			queryResult: {},
			// 此查詢的 timeout 秒數
			queryTimeoutS: {},
		}
	},
	methods: {
		/** 查詢 : 清空資料 */
		baseQuery(key, param) {
			let result = this.queryResult[key];
			if (result && result.timeout) {
				console.log(`ClearQueryTimeout [${key}] by baseQuery`);
				clearTimeout(result.timeout);
				delete result.timeout;
			}
			this.$set(this.queryResult, key, []);
			result = this.queryResult[key];
			this.$set(result, "$STATUS", "QUERY");
			this.$set(result, "$CD", -999);
			this.$set(result, "$MSG", "");
			// 查詢 Timeout
			let timeoutS = this.queryTimeoutS[key] = param && param.first ? this.getFirstTimeout()  : this.getOthersTimeout();
			console.log(`Query [${key}] (timeout: ${timeoutS})`);
			// 因送出到收到server回應這段也需要逾時機制，所以一開始就要設定逾時機制，不能等到收到server資料再來設定逾時
			this.configTimeout({key, result});
			return result;
		},
		// 設定逾時資訊
		configTimeout({key, result}) {
			// 當前交易連線處於[正常連線/登入中]時，才生成逾時Timeout (嘗試避免連線異常時也出現查詢導致的 -99110 提示) https://trello.com/c/9I1dpwxd
			if (!this.selectedWSConn || !this.selectedWSConn.loginReady)
				return;
			result.timeout = setTimeout(()=>{
				console.log(`M4C.Base [${key}] Query Timeout ! `);
				this.$set(result, "$STATUS", "FAIL");
				this.$set(result, "$CD", -99110);
				this.$set(result, "$MSG", this.$ln(`伺服器无回应`));
				// 查詢失敗提示
				if (this.enableQueryFailNotify) {
					this.$store.state.notify({
						icon: `error`,
						head: `查询失败`,
						body: `(${result.$CD}) ${result.$MSG}`,
					});
				}
			}, (this.queryTimeoutS[key] || 10) * 1000);
		},
		/** 設定或重置此查詢的 timeout (只有設定逾時才能執行重設)*/
		resetTimeout({key, result}) {
			if (result.timeout) {
				clearTimeout(result.timeout);
				delete result.timeout;
				this.configTimeout({key, result});
			}
		},
		/** 收到資料 */
		baseOnData(key, data) {
			let result = this.queryResult[key];
			if (result == null)
				return;
			// 收到資料
			if (data.cd === 0) {
				// 持續把回覆資料塞入 data 讓元件可以處理
				this.$set(result, "data", data);
				// 重置此查詢的timeout
				this.resetTimeout({key, result});
			}
			// cd < 0 -> 查詢失敗，結束 timeout
			else if (data.cd < 0) {
				this.$set(result, "$STATUS", "FAIL");
				console.log(`ClearQueryTimeout [${key}] by cd<0`);
				clearTimeout(result.timeout);
				delete result.timeout;
			}
			// 收到 lt 視為全部完成
			// cd: 40為回補市況mkt命令完成。
			else if (data.lt || data.cd == 40) {
				this.$set(result, "$STATUS", "DONE");
				console.log(`ClearQueryTimeout [${key}] by lt=true`);
				clearTimeout(result.timeout);
				delete result.timeout;
			}
			return result;
		},
		/** 收到 Trade 資料 */
		baseOnTradeData(key, data, changeLanguageKey, ignoreFail) {
			let result = this.queryResult[key];
			if (result == null)
				return;
			// if (data.cd === 2) data.cd = -11;

			// 部分回應沒有 d -> 預設給空物件
			data.d = data.d || {};
			// 命令已完成(cd=2) -> 略過
			if (data.cd === 1) {
				return result;
			}
			// 有指定錯誤代碼轉語系時
			if (changeLanguageKey)
				M4C.responseChangeLanguage(data, changeLanguageKey);

			// 命令已完成(cd=2)
			if (data.cd === 2) {
				// count=0 表示為無回覆內容的成功
				if (data.d.count === 0)
					this.$set(result, "$CD", 0);
			}
			// data.cd!=2 的內容才是查詢結果 (才可套用其 cd 與 msg)
			else {
				// 持續把回覆資料塞入 data 讓元件可以處理
				this.$set(result, "data", data);
				// 重置此查詢的timeout
				this.resetTimeout({key, result});
				// 錯誤代碼->$CD, 錯誤訊息->$MSG
				if (data.$CD != null)
					this.$set(result, "$CD", data.$CD);
				if (data.$MSG != null)
					this.$set(result, "$MSG", data.$MSG);
			}

			// cd = 7 (命令處理中) -> 視為仍在查詢中
			if (data.cd === 7) {
				this.$set(result, "$STATUS", "QUERY");
			}
			// cd = -534 (GW命令過於頻繁) -> 視為仍在查詢中
			else if (data.cd === -534) {
				this.$set(result, "$STATUS", "QUERY");
			}
			// cd < 0 -> 查詢失敗，結束 timeout
			else if (data.cd < 0) {
				this.$set(result, "$STATUS", "FAIL");
				console.log(`ClearQueryTimeout [${key}] by cd<0`);
				clearTimeout(result.timeout);
				delete result.timeout;
				// 支持 ERR 訊息處理 https://trello.com/c/4IqcIDhI
				let errMsg = this.supportERR(data);
				// 部分失敗情境
				if (data.cd === -11) {
					let lnKey = `CMD_${data.c}`;
					let str = this.$ln(lnKey);
					str = str === lnKey ? '' : str;
					console.log(`部分查詢失敗 : `, data.cd, lnKey);
					this.$store.state.notify({
						icon: `error`,
						head: this.$ln('PARTIAL_FAIL_TITLE'),
						htmlBody: errMsg || `(${data.cd}) ${str} ${this.$ln('PARTIAL_FAIL_MSG')} ${data.d.memo ? '<br>' + data.d.memo :''}`,
						delay: 6000,
					});
				}
				// 查詢失敗提示
				else if (this.enableQueryFailNotify && !ignoreFail) {
					this.$store.state.notify({
						icon: `error`,
						head: `查询失败`,
						htmlBody: errMsg || `(${data.cd}) ${data.$MSG || ''} ${data.d.memo  ? '<br>' + data.d.memo  :''}`,
					});
				}
			}
			// 收到 lt 視為全部完成 (必須是非 -534 情境)
			// else if (data.lt && result.$CD !== -534) {
			// 收到 lt 視為全部完成
			else if (data.lt) {
				// 已經 FAIL 的就不再切為 DONE
				if (result.$STATUS !== "FAIL") {
					this.$set(result, "$STATUS", "DONE");
				}
				console.log(`ClearQueryTimeout [${key}] by lt=true`);
				clearTimeout(result.timeout);
				delete result.timeout;
			}
			return result;
		},
		// 支持 ERR 訊息處理 https://trello.com/c/4IqcIDhI
		supportERR(data) {
			// 支持 ERR 錯誤提示，有 ERR 時優先顯示 (以下3個 client 自製的測試情境)
			// data.cd = -11; data.d.ERR = {"IB":"-920"};
			// data.d.ERR = {"IB":"-920","OB":"-920"};
			// data.d.ERR = {"IB":"模擬IB後台錯誤訊息","OB":"-920"};
			// data.d.ERR = {"IB":"模擬IB後台錯誤訊息","OB":"模擬OB後台錯誤訊息"};
			let errKey = '', errMsg = '';
			if (data.d.ERR) {
				// 將 IB, OB 依序組合起來形成組合Key轉語系
				for (let ibob in data.d.ERR) {
					errKey += (errKey ? ',':'') + `${ibob}:${data.d.ERR[ibob]}`;
				}
				errMsg = this.$ln(errKey);
				// 組合Key對不到語系檔時 -> 個別Key分開對應
				if (errKey === errMsg) {
					errMsg = '';
					for (let ibob in data.d.ERR) {
						errMsg += (errMsg ? '<br>':'') + this.$ln(`${ibob}:${data.d.ERR[ibob]}`);
					}
				}
			}
			return errMsg;
		},
		/** 直接將查詢狀態切換為已完成 */
		baseResultDone(result) {
			if (result)
				this.$set(result, "$STATUS", "DONE");
		},
		getFirstTimeout() {
			let ts;
			try {ts = this.$store.state.config.tradePdSetting.broker.query_timeout.first;}catch(err){}
			if (!ts) ts = this.getOthersTimeout() * 3;
			return ts;
		},
		getOthersTimeout() {
			let ts;
			try {ts = this.$store.state.config.tradePdSetting.broker.query_timeout.others;}catch(err){}
			return ts || 10;
		},
	},
	watch: {
	},
	computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		// 啟用[查詢失敗彈出提示]機制
		enableQueryFailNotify() {
			// 先暫時從 TW 開始，之後視情況調整
			return this.twMode;
		},
		selectedWSConn() {
			return this.$store.state.selectedWSConn;
		},
	}
}