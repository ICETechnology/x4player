<template>
    <div class="m4c-position hidden">
		<span>{{normalPositionSumMap}}</span>
	</div>
</template>

<script>
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			/** SymbolID to PositionSumObject 對應表 */
			positionSumMap: {},
			/** requestID to baID */
			ridToBAID: {},
			/** 查詢已平倉記錄結果狀態 */
			queryOffsetRecordResult: {},
			/** 已平倉記錄資料 */
			offsetRecordData: [],
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Position = this.$store.state.m4c.position = this;
		// 註冊資料分派 - 持倉匯總資料
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.positionsum', 'callback': this.onPositionSumData.bind(this)});
		// 註冊資料分派 - 更新持倉風控
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.positionsum.property.update', 'callback': this.onUpdateRisk.bind(this)});
		M4C.regDispatch({'s': 'TRADE', 'c': 'position.limit.query', 'callback': this.onPositionLimitData.bind(this)});
		// 交易連線登入完成
		M4C.on("TRADER-LOGIN-READY", wsConn => {
			// 準備解除訂閱持倉明細 (目前用不到)
			// 取得此交易連線所有資金帳號
			let accountList = wsConn.accounts.map(o=>o.ACCOUNT_ID);
			let cmd = {
				"s": "TRADE",
				"c": "account.position.unsub",
				"d": {
					"BROKER_ID": wsConn.bto.brokerID,
					"ACCOUNT_ID": accountList,
				},
				"r": "".random(),
			};
			M4C.send(cmd, {'wsConn': wsConn});
		});
		// 註冊資料分派 - 持倉匯總資料
		M4C.regDispatch({'s': 'TRADE', 'c': 'account.offset', 'callback': this.onOffsetRecordData.bind(this)});
	},
    methods: {
		/** 啟始化持倉匯總資料 */
		initPositionSum(param) {
			if (!this.baID) return;
			let result = this.$store.state.result.queryPositionSumResult = this.baseQuery(`${this.baID}|account.positionsum`, param);
			// 沒帶參數或是指不不清空資料，才執行預設清空資料的動作
			if(!param || !param.noClearData)
				this.clearAllData();
			return result;
		},
		/** 清空資料 */
		clearAllData() {
			this.positionSumMap = {};
			let result = this.$store.state.result.queryPositionSumResult;
			this.$set(result, 'normalPositionSumList', this.$store.state.data.normalPositionSumList = []);
			this.$set(result, 'compositePositionSumList', this.$store.state.data.compositePositionSumList = []);
		},
		// 重新查詢持倉匯總
		queryPositionSum(param) {
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			let result = this.initPositionSum(param);
			let rid = "".random();
			this.ridToBAID[rid] = this.baID;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'account.positionsum';
			cmd.r = rid;
			cmd.d = {};
			cmd.d.ACCOUNT_ID = this.accountID;
			M4C.send(cmd);
			return result;
		},
		// 查詢已平倉記錄
		queryOffsetRecord(param){
			if (!this.accountID) return;
			if (!this.$store.state.selectedWSConn.loginReady) return;
			// 查詢結果
			this.queryOffsetRecordResult = this.baseQuery(`${this.baID}|account.offset`);
			// 清空資料
			this.offsetRecordData = [];
			let rid = "".random();
			this.ridToBAID[rid] = this.baID;
			let cmd = {};
			cmd.s = 'TRADE';
			cmd.c = 'account.offset';
			cmd.r = rid;
			cmd.d = {};
			cmd.d.ACCOUNT_ID = this.accountID;
			cmd.d.BEGIN_DATE = param.start || new Date().day8();
			cmd.d.END_DATE = param.end || new Date().day8();
			M4C.send(cmd);
			return this.queryOffsetRecordResult;
		},
		// 收到持倉匯總資料
		onPositionSumData(data) {
			let self = this;
			if (!data.d) return;
			let baID = data.d.BROKER_ID && data.d.ACCOUNT_ID ? `${data.d.BROKER_ID}|${data.d.ACCOUNT_ID}` : this.ridToBAID[data.r];
			let result = self.baseOnTradeData(`${baID}|account.positionsum`, data);
			// 僅處理當前關注子帳
			if (baID === this.baID) {
				// 陣列內容時可視為回補完成
				if (Array.isArray(data.d.POSITIONSUM)) {
					self.clearAllData();
					// 斷線重連情境會沒有 lt:true，需要看到陣列資料時把狀態更新為完成 (否則會停留在 QUERY 狀態)
					let result = this.$store.state.result.queryPositionSumResult;
					this.$set(result, "$STATUS", "DONE");
				}
				let positionList = data.d.POSITIONSUM || [data.d];
				// 是否更新風控
				let isUpdateRisk = false;
				positionList.forEach((obj, idx)=>{
					// 此持倉是組合持倉
					// obj.$IS_COMPOSITE = Array.isArray(obj.COMPOSITE_LIST);
					self.$set(obj, `$IS_COMPOSITE`, Array.isArray(obj.COMPOSITE_LIST));
					// 為避免組合持倉的Key出現相同商品但買賣相反的問題，因此在key中加入買賣方向
					let symbolID = obj.$IS_COMPOSITE ? 
						`${obj.COMPOSITE_LIST[0].SYMBOL}_${obj.COMPOSITE_LIST[0].SIDE}|${obj.COMPOSITE_LIST[1]? obj.COMPOSITE_LIST[1].SYMBOL+'_'+obj.COMPOSITE_LIST[1].SIDE: ''}` : obj.SYMBOL;
					// 此持倉是全新持倉
					let isNewPosition = !self.positionSumMap[symbolID];

					// 回補複式部位的COMPOSITE_LIST，有變動的項目才覆蓋
					if(obj.$IS_COMPOSITE && self.positionSumMap[symbolID] && obj.COMPOSITE_LIST){
						obj.COMPOSITE_LIST[0] = Object.assign(
						self.positionSumMap[symbolID].COMPOSITE_LIST[0], obj.COMPOSITE_LIST[0]);
						obj.COMPOSITE_LIST[1] = Object.assign(
						self.positionSumMap[symbolID].COMPOSITE_LIST[1], obj.COMPOSITE_LIST[1]);
					}					
					
					// 同 ReportKey 時 -> 欄位覆蓋 (pso = PositionSumObject 簡寫)
					let pso = self.positionSumMap[symbolID] = Object.assign(
						self.positionSumMap[symbolID] || {},
						obj
					);
					// 擴增方便性欄位
					pso.$SYMBOL = symbolID;
					self.extendColumn(pso);

					// 新持倉 -> 更新 [持倉匯總] 響應式列表 & 排序
					if (isNewPosition) {
						// 全新持倉(非組合持倉)卻沒有任何買賣數量時，直接忽略
						if (!pso.$BQTY && !pso.$SQTY && !pso.$IS_COMPOSITE) {
							delete self.positionSumMap[symbolID];
							return;
						}
						// 加入持倉匯總列表內
						if (!pso.$IS_COMPOSITE) {
							// 判斷是否是需要加入風控的持倉
							if(!pso.SUM_DELTA_GAMMA) {
								// 無條件設定加總資金的$delta、$gamma
								pso.SUM_DELTA_GAMMA = true;
								isUpdateRisk = true;
							}
							this.normalPositionSumList.push(pso);
							// 新增持倉
							eventBus.$emit("NORMAL-POSITION-APPEND", pso);
						}
						// 因遇到server回補完整持倉後又即時推送買賣皆為0的組合持倉。因此加入數量判斷
						else if(pso.$IS_COMPOSITE && pso.$COMPOSITE_QTY != 0) {
							this.compositePositionSumList.push(pso);
						}
						// 用一個簡單的延遲來等待所有資料到位再一次性排序
						if (self.sortTimeout)
							clearTimeout(self.sortTimeout);
						self.sortTimeout = setTimeout(self.sort, 100);
					}
					// 一般持倉匯總已存在的持倉 -> 買賣量都變為0 -> 移除
					else if (!pso.$IS_COMPOSITE && pso.$BQTY==0 && pso.$SQTY==0){
						// 清除該商品的記憶 (下次再收到該商品時需視為新持倉)
						delete self.positionSumMap[symbolID];
						// 從一般持倉陣列中移除
						this.normalPositionSumList.forEach((thisPSO, index, array)=>{
							if (thisPSO.SYMBOL === pso.SYMBOL) {
								array.splice(index, 1);
								// 移除持倉
								eventBus.$emit("NORMAL-POSITION-REMOVE", pso);
							}
						});
					}
				});
				// 有持倉未加入風控時更新風控
				if(positionList.length && isUpdateRisk)
					this.updateRisk();
				// 刷新當前關注商品的即時損益
				this.refreshPL();
			}
		},
		onOffsetRecordData(data) {
			let self = this;
			if (!data.d) return;
			let baID = data.d.BROKER_ID && data.d.ACCOUNT_ID ? `${data.d.BROKER_ID}|${data.d.ACCOUNT_ID}`: this.ridToBAID[data.r];
			self.queryOffsetRecordResult = self.baseOnTradeData(`${baID}|account.offset`, data);
			// 僅處理當前關注子帳
			if (baID === this.baID && self.queryOffsetRecordResult) {
				// 陣列內容時可視為回補完成
				if (Array.isArray(data.d.OFFSET)) {
					self.offsetRecordData = data.d.OFFSET;
					// 斷線重連情境會沒有 lt:true，需要看到陣列資料時把狀態更新為完成 (否則會停留在 QUERY 狀態)
					this.$set(this.queryOffsetRecordResult, "$STATUS", "DONE");
				}
			}
		},
		// 對『所有回報』進行排序, 追加回補市況檢查下市
		sort() {
			let list = this.normalPositionSumList;
			if (list) {
				console.time(`M4C.Position.sort()`);
				list.sort((a, b)=>{
					return a.SYMBOL > b.SYMBOL ? 1: -1;
				});
				console.timeEnd(`M4C.Position.sort()`);
			}

			// 回補市況用以判別是否已下市 (已經有市況的不再回補)
			let rcvList = [];
			this.normalPositionSumList.forEach((pso)=>{
				let sid = pso.SYMBOL;
				let qo = M4C.Quote.getQuoteObject(sid);
				if (!qo.s) rcvList.push(sid);
			});
			if (rcvList.length > 0)
				M4C.Quote.rcvMkt(rcvList);

		},
		// 擴增方便性欄位
		extendColumn(obj) {
			// 交易所名稱
			obj.$EXG_NAME = obj.$EXG_NAME || M4C.Symbol.getExchangeName(obj.SYMBOL);
			// 合約名稱
			if (!obj.$CONTRACT_NAME)
				obj.$CONTRACT_NAME = M4C.Symbol.getCNM4(obj.SYMBOL, " ");
			if (!obj.$MINFO)
				obj.$MINFO = M4C.Symbol.getMainformInfo(obj.SYMBOL);
			// 組合持倉數量(多方-空方)https://trello.com/c/NNoKijZP/
			if(obj.$IS_COMPOSITE) {
				// server舊的格式
				let cpsd1 = obj.COMPOSITE_LIST[0];
				let oldQty = +Big(cpsd1.QTY || 0).plus(cpsd1.PREV_QTY || 0).plus(cpsd1.COVERED_QTY || 0).plus(cpsd1.PREV_COVERED_QTY || 0);
				// server新的格式
				let buyQty = +Big(obj.BUY_QTY || 0).plus(obj.PREV_BUY_QTY || 0);
				let sellQty = +Big(obj.SELL_QTY || 0).plus(obj.PREV_SELL_QTY || 0);
				// 沒有新格式的資料才用舊的。
				obj.$COMPOSITE_QTY = obj.BUY_QTY? +Big(buyQty).minus(sellQty): oldQty;
			}
			// 支持台灣複式選擇權
			if (this.twMode && obj.$IS_COMPOSITE) {
				let s1 = obj.COMPOSITE_LIST[0];
				let s2 = obj.COMPOSITE_LIST[1];
				obj.$COMPOSITE_QTY = Number(s1.QTY) || Number(s2.QTY);
				obj.$OFFSETABLE_QTY = Number(s1.OFFSETABLE_QTY) || Number(s2.OFFSETABLE_QTY);
			}
			obj.$CP = "";
			obj.$BS = "";
			obj.$BUYSELL = "";
			// 多方持倉均價
			obj.$BAVG = "";
			// 空方持倉均價
			obj.$SAVG = "";
			// 淨倉均價
			obj.$BSAVG = "";
			// 是否有勾選加入風控
			obj.SUM_DELTA_GAMMA = obj.SUM_DELTA_GAMMA || false;
			// 多方備兌持倉量 (含昨備兌倉)
			obj.$CBQTY = +Big(obj.COVERED_BUY_QTY || 0).plus(obj.PREV_COVERED_BUY_QTY || 0);
			// 多方持倉量 (含昨倉，含多方備兌持倉量)
			obj.$BQTY = +Big(obj.BUY_QTY || 0).plus(obj.PREV_BUY_QTY || 0).plus(obj.$CBQTY);
			// 多方可平倉量
			obj.$OBQTY = +Big(obj.OFFSETABLE_BUY_QTY || 0).plus(obj.OFFSETABLE_COVERED_BUY_QTY || 0);
			// 空方備兌持倉量 (含昨備兌倉)
			obj.$CSQTY = +Big(obj.COVERED_SELL_QTY || 0).plus(obj.PREV_COVERED_SELL_QTY || 0);
			// 空方持倉量 (含昨倉，含空方備兌持倉量)
			obj.$SQTY = +Big(obj.SELL_QTY || 0).plus(obj.PREV_SELL_QTY || 0).plus(obj.$CSQTY);
			// 多方可平倉量
			obj.$OSQTY = +Big(obj.OFFSETABLE_SELL_QTY || 0).plus(obj.OFFSETABLE_COVERED_SELL_QTY || 0);
			// 可用(可平倉)淨倉數量
			obj.$NET_OFFSETABLE_QTY = +Big(obj.$OBQTY || 0).minus(obj.$OSQTY || 0);
			// 淨備兌持倉量
			obj.$NET_COVERED_QTY = +Big(obj.$CBQTY || 0).minus(obj.$CSQTY || 0);
			// 淨今倉量
			obj.$NET_BUY_SELL_QTY = +Big(obj.BUY_QTY || 0).minus(obj.SELL_QTY || 0); 
			// 淨昨倉量
			obj.$NET_PREV_BUY_SELL_QTY = +Big(obj.PREV_BUY_QTY || 0).minus(obj.PREV_SELL_QTY || 0); 
			// 淨今備兌倉量
			obj.$NET_COVERED_BUY_SELL_QTY = +Big(obj.COVERED_BUY_QTY || 0).minus(obj.COVERED_SELL_QTY || 0); 
			// 淨昨備兌倉量
			obj.$NET_PREV_COVERED_BUY_SELL_QTY = +Big(obj.PREV_COVERED_BUY_QTY || 0).minus(obj.PREV_COVERED_SELL_QTY || 0); 
			// 淨備兌可平倉量
			obj.$NET_COVERED_OFFSETABLE_QTY = +Big(obj.OFFSETABLE_COVERED_BUY_QTY || 0).minus(obj.OFFSETABLE_COVERED_SELL_QTY || 0); 
			// 多方有量時
			if (obj.$BQTY > 0) {
				obj.$CP += "C";
				obj.$BS += "B";
				obj.$BUYSELL += "BUY";
				// [開倉均價] 改為顯示 [逐筆開倉均價] https://trello.com/c/Fb5Fdabo
				obj.$BAVG = obj.$BSAVG = parseFloat(obj.BUY_PRICE) || parseFloat(obj.PREVIOUS_PRICE);
			}
			// 空方有量時
			if (obj.$SQTY > 0) {
				obj.$CP += "P";
				obj.$BS += "S";
				obj.$BUYSELL += "SELL";
				// [開倉均價] 改為顯示 [逐筆開倉均價] https://trello.com/c/Fb5Fdabo
				obj.$SAVG = obj.$BSAVG = parseFloat(obj.SELL_PRICE) || parseFloat(obj.PREVIOUS_PRICE);
			}

			obj.$BQTY = obj.$BQTY || 0;
			obj.$SQTY = obj.$SQTY || 0;
			obj.$CBQTY = obj.$CBQTY || 0;
			obj.$CSQTY = obj.$CSQTY || 0;
			// 淨倉數量 (含昨倉)
			obj.$NET_QTY = +Big(obj.$BQTY).minus(obj.$SQTY);
			// 持倉數量 (僅單邊情境可用)
			obj.$QTY = parseFloat(obj.$BQTY) || parseFloat(obj.$SQTY);
			// 開倉均價 (僅單邊情境可用)
			obj.$OPEN_PRICE = parseFloat(obj.$BAVG) || parseFloat(obj.$SAVG);
			// 多空並存情境 (淨倉均價)
			if (obj.$BQTY && obj.$SQTY) {
				obj.$BSAVG =  parseFloat(((obj.$BQTY * obj.$BAVG + obj.$SQTY * obj.$SAVG) / (obj.$BQTY + obj.$SQTY)).toFixed(2));
			}
			// 標的商品SID
			obj.$UNDERLYING_S = M4C.Symbol.getUnderlyingS(obj.SYMBOL);
			// 經 Client 即時試算的 (僅當前選擇商品) 即時損益欄位
			// 20230720 註解掉這行，理由是 $PL 僅限於關注商品，且由 client 試算，不應再從 server 資料覆蓋
			// obj.$PL = Number(obj.UNREALIZED_PL) || obj.$PL;
			// 更新時間
			if (obj.UPDATE_TIME)
				obj.$UPDATE_TIME = new Date(obj.UPDATE_TIME).time8();
			obj.$BUY_PRICE = Number(obj.BUY_PRICE);
			obj.$BUY_PRICE_DAILY = Number(obj.BUY_PRICE_DAILY);
			obj.$SELL_PRICE = Number(obj.SELL_PRICE);
			obj.$SELL_PRICE_DAILY = Number(obj.SELL_PRICE_DAILY);
			obj.$DELTA = Number(obj.DELTA);
			obj.$GAMMA = Number(obj.GAMMA);
		},

		// 更新加入風控的持倉商品列表
		updateRisk() {
			M4C.send({
				"s": "TRADE",
				"c": "account.positionsum.property.update",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.$store.state.login.accountID,
					"SUM_DELTA_GAMMA": this.normalPositionSumList.filter(o=>o.SUM_DELTA_GAMMA).map(o=>o.SYMBOL),
				},
				"r" : "".random(),
			});
			return this.baseQuery('DataUpdateRisk');
		},
		// 收到更新風控命令結果
		onUpdateRisk(data) {
			let result = this.baseOnTradeData('DataUpdateRisk', data);
		},

		// 查詢持倉限額
		queryPositionLimit(Symbol) {
			if (!this.baID) return;
			let result = this.$store.state.result.queryPositionLimitResult = this.baseQuery(`${this.baID}|PositionLimitQuery`);
			this.$set(result, 'positionLimitList', this.$store.state.data.positionLimitList = []);
			let cmd = {
				"s": "TRADE",
				"c": "position.limit.query",
				"d": {
					"BROKER_ID": this.$store.state.login.brokerID,
					"ACCOUNT_ID": this.$store.state.login.accountID,
				},
				"r" : "".random(),
			};
			if(Symbol)
				cmd.d.SYMBOL = Symbol;

			M4C.send(cmd);
			return result;
		},
		// 持倉限額資料
		onPositionLimitData(data) {
			let self = this;
			if (!data.d) return;
			let baID = data.d.BROKER_ID && data.d.ACCOUNT_ID ? `${data.d.BROKER_ID}|${data.d.ACCOUNT_ID}` : this.ridToBAID[data.r];
			let result = self.baseOnTradeData(`${baID}|PositionLimitQuery`, data);
			// 僅處理當前關注子帳持倉限額資料
			if (baID === this.baID && data.cd === 0) {
				this.$store.state.data.positionLimitList.push(data.d);
			}
		},
		// 刷新當前關注商品的即時損益
		refreshPL() {
			// 當前關注合約存在部位
			if (this.selectedSymbolHasPosition) {
				// 以對手價計算損益
				if (vuex.config.profitByOpposite) {
					// 多方 以買價第一檔計算損益
					if (vuex.selectedSymbol.positionSum.$NET_QTY > 0)
						this.updatePositionPL(vuex.selectedSymbol.QO.bp1 || this.newestPrice);
					// 空方 以賣價第一檔計算損益
					else if (vuex.selectedSymbol.positionSum.$NET_QTY < 0)
						this.updatePositionPL(vuex.selectedSymbol.QO.sp1 || this.newestPrice);
				}
				// 以市價計算損益
				else 
					this.updatePositionPL(this.newestPrice);
			}
		},
		// 重算當前關注商品的即時損益
		updatePositionPL(usePrice) {
			let pso = this.selectedSymbol.positionSum;
			let weight = this.selectedSymbol.MInfo.Weight || 1;
			let bqty = pso.$BQTY;
			let sqty = pso.$SQTY;
			// 因M4C.Symbol.getDecimalLength取長度會因tw的乘數、分數取到非預期長度，所以改以ticksize取長度
			let decLen = M4C.Symbol.getTickSize(pso.SYMBOL, usePrice).toString().getDecimalLength() + 2;
			// 因server給的均價有可能是溢位後的價格(ex: sell price: 3033.4571428571, Qty: 7),，所以取ticksize長度4捨5入的價格來計算
			let bavg = Math.round(pso.$BAVG * (Math.pow(10, decLen))) / Math.pow(10, decLen);
			// 多方逐筆損益匯總 (多方成本差)
			let buyOpenProfit = this.$safeFloat(this.$safeFloat(usePrice - bavg) * bqty * weight);
			// 因server給的均價有可能是溢位後的價格(ex: sell price: 3033.4571428571, Qty: 7),，所以取ticksize長度4捨5入的價格來計算
			let savg = Math.round(pso.$SAVG * (Math.pow(10, decLen))) / Math.pow(10, decLen);
			// 空方逐筆損益匯總 (空方成本差)
			let sellOpenProfit = this.$safeFloat(this.$safeFloat(savg - usePrice) * pso.$SQTY * weight);
			// 逐筆盈虧(浮動損益)
			pso.$PL = this.$safeFloat(buyOpenProfit + sellOpenProfit);
			// 支持盈虧說明
			vuex.selectedSymbol.plMemo = {usePrice, bavg, bqty, savg, sqty, weight, buyOpenProfit, sellOpenProfit};
		},
	},
	watch: {
		/** 資金帳號切換 -> 重查 */
        btaID(nv, ov){
            // 有切換帳號才重查，新登入不處理(交由loginReady時執行)。
            if(ov && nv != ov)
                this.queryPositionSum();
		},
		// 總表完成 && 登入完成
		mainformReadyAndLoginReady(nv) {
			if (nv)
				this.queryPositionSum({first: true});
			else
				this.clearAllData();
		},
		/** 語系切換 -> 重查 (即可在重新收到資料的過程轉出新語系的字詞) */
		'$store.state.lang.language'(nv) {
			this.queryPositionSum();
		},
		// 最新價改變 -> 若未設定以對手價計算損益 -> 更新損益
		'selectedSymbol.QO.p'(nv) {
			if (this.selectedSymbolHasPosition && !vuex.config.profitByOpposite) {
				this.updatePositionPL(nv);
			}
		},
		// 買價第一檔改變 -> 若設定以對手價計算損益 && 當前是多方 -> 更新損益
		'selectedSymbol.QO.bp1'(nv) {
			if (this.selectedSymbolHasPosition && vuex.config.profitByOpposite && vuex.selectedSymbol.positionSum.$NET_QTY > 0) {
				this.updatePositionPL(nv);
			}
		},
		// 賣價第一檔改變 -> 若設定以對手價計算損益 && 當前是空方 -> 更新損益
		'selectedSymbol.QO.sp1'(nv) {
			if (this.selectedSymbolHasPosition && vuex.config.profitByOpposite && vuex.selectedSymbol.positionSum.$NET_QTY < 0) {
				this.updatePositionPL(nv);
			}
		},
		// 切換 以對手價計算損益
		'$store.state.config.profitByOpposite'(nv) {
			this.refreshPL();
		},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		baID() {
			return this.$store.state.login.baID;
		},
		btaID() {
			return this.$store.state.login.btaID;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		accountID() {
			return this.$store.state.login.accountID;
		},
		mainformReadyAndLoginReady() {
			return this.$store.state.status.mainformReady && this.$store.state.selectedWSConn.loginReady;
		},
		/** 持倉匯總(一般)資料陣列 */
		normalPositionSumList() {
			return this.$store.state.data.normalPositionSumList;
		},
		normalPositionSumMap() {
			let map = this.$store.state.data.normalPositionSumMap = {};
			this.normalPositionSumList.forEach((psd)=>{
				map[psd.SYMBOL] = psd;
			});
			return map;
		},
		/** 持倉匯總(組合)資料陣列 */
		compositePositionSumList() {
			return this.$store.state.data.compositePositionSumList;
		},

		/** ===== 支持計算當前選擇商品的即時損益 ===== */
		selectedSymbol() {
			return this.$store.state.selectedSymbol;
		},
		/** 用來判斷當前選擇商品是否存在持倉 */
		selectedSymbolHasPosition() {
			return !!this.selectedSymbol.positionSum.SYMBOL;
		},
		firstTimeout() {
			try {return this.$store.state.config.acPdSetting.broker.query_timeout.first;}catch(err){}
		},
		// 最新價格
		newestPrice() {
			let qo = vuex.selectedSymbol.QO;
			return qo.p || qo.c || qo.st || qo.r || qo.pc;
		},
	},
}
</script>
