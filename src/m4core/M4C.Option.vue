<template>
    <div class="m4c-option hidden">
		underlyingSid: {{underlyingSid}}
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Option = this.$store.state.m4c.option = this;
	},
    methods: {
		/** 預設為第一個交易所的第一檔期權商品 */
		setFirstSymbol() {
			let exgList = M4C.Symbol.getClassification("OPT");
			if (exgList && exgList[0])
				this.$store.state.opt.selectedSymbol = this.getOptPureSymbol(exgList[0].Node[0]);
		},
		// 修補缺漏的合約
		fixContracts(obj) {
			obj.C.forEach((sid,idx)=>{
				let sidP = sid.replace('.C.', '.P.');
				if (obj.P.indexOf(sidP) === -1)
					obj.P.push(sidP);
			});
			obj.P.forEach((sid,idx)=>{
				let sidC = sid.replace('.P.', '.C.');
				if (obj.C.indexOf(sidC) === -1)
					obj.C.push(sidC);
			});
			obj.C = obj.C.sort((a,b)=>{return Number(this.getStrike(a)) > Number(this.getStrike(b)) ? 1 : -1;});
			obj.P = obj.P.sort((a,b)=>{return Number(this.getStrike(a)) > Number(this.getStrike(b)) ? 1 : -1;});
		},
		/** 設定選擇的 symbolObj (這是分類表中的 symbol 層物件) */
		updateSymbolObj(symbolObj) {
			// 此商品所對應的所有合約 ex. {"202004": {"C":[...], "P"::[...]}, "202005": {"C"::[...], "P"::[...]},...}
			let contracts = {}, firstSidList;
			symbolObj.Node.forEach((monthObj)=>{
				let obj = contracts[monthObj.ENG] = {};
				// obj.C = monthObj.Node[0].Contracts;
				// obj.P = monthObj.Node[1].Contracts;
				// 支持只來單邊的情況 (不固定將 Node[0] -> C, Node[1] -> P)，而是直接看進去 Contracts[0] 來決定這一份是 C or P
				monthObj.Node.forEach(node=>{
					if (node.Contracts[0]) {
						if (node.Contracts[0].indexOf('.C.') !== -1)
							obj.C = node.Contracts;
						else if (node.Contracts[0].indexOf('.P.') !== -1)
							obj.P = node.Contracts;
					}
				});
				obj.C = obj.C || [];
				obj.P = obj.P || [];
				firstSidList = firstSidList || obj.C || obj.P;
				// 支持修復填入缺少的合約
				if (obj.C.length !== obj.P.length) {
					console.log('合約修補前 : ', JSON.stringify(obj));
					this.fixContracts(obj);
					console.log('合約修補後 : ', JSON.stringify(obj));
				}
			});
			// 當前期權所有合約
			this.$store.state.opt.contracts = contracts;
			// 當前期權商品總表
			let minfo = M4C.Symbol.getMainformInfo(this.selectedSymbol);
			this.$store.state.opt.selectedMainformInfo = minfo;
			// 當前期權標的物物件 (minfo.Underlying)
			this.$store.state.opt.underlying = minfo ? minfo.Underlying : {};
			// 當前期權履約價間隔 (策略下單盒要用)
			if (firstSidList) {
				let strike0 = M4C.Option.getStrike(firstSidList[0]);
				let strike1 = M4C.Option.getStrike(firstSidList[1]);
				M4C.Option.setCurStrikePriceStep(+Big(strike1).minus(strike0));
			}
		},
		// 從分類表中找出當前 selectedSymbol 的 symbolObj
		getSymbolObj(symbol) {
			// 轉換無除權息商品代碼
			let noPriadjSymbol = this.noPRIADJ(symbol);
			let symbolObj = null;
			let exgList = M4C.Symbol.getClassification("OPT");
			if (!exgList) return;
			exgList.forEach((exgObj)=>{
				if (exgObj.Node) {
					exgObj.Node.forEach((sbObj)=>{
						if (noPriadjSymbol === this.getOptPureSymbol(sbObj))
							symbolObj = sbObj;
					});
				}
			});
			return symbolObj;
		},
		/** 取得期權商品的履約價 */
		getStrike(sid) {
			return sid.split(/\.[CP]\./)[1];
		},
		/** 取得期權商品的CP */
		getCallPut(sid) {
			return sid.split('.')[5] || '';
		},
		/** 設定當前商品履約價間隔 */
		setCurStrikePriceStep(num) {
			this.curStrikePriceStep = num;
		},
		/** 取得當前商品履約價間隔 */
		getCurStrikePriceStep(num) {
			return this.curStrikePriceStep;
		},
		/** (選擇權) 取得不含月份以下的商品代碼 (ex."I.O.SSE.510050.202004.C.2.35"->"I.O.SSE.510050") */
		getOptPureSymbol(symbolObj) {
			try {
				let mthObj = symbolObj.Node[0];
				// 避免受到週台期影響 : 週台期會排前面所以會拿到 "202009W2" -> "I.O.TWF.TX2"，但是希望要拿到 "I.O.TWF.TXO"，所以從最後面拿
				if (mthObj.ENG.length === 8 && symbolObj.Node.length>1)
					mthObj = symbolObj.Node[symbolObj.Node.length-1];
				let sid = mthObj.Node[0].Contracts[0];
				// 排除除權息代碼
				sid = this.noPRIADJ(sid);
				return sid.split('.').slice(0,4).join('.');
			}catch(err){}
		},
		/** 排除除權息代碼 "I.O.SSE.510050A.202004.C.2.35" -> "I.O.SSE.510050.202004.C.2.35"*/
		noPRIADJ(sid) {
			try {
				let minfo = M4C.Symbol.getMainformInfo(sid);
				let A = minfo.SetPRIADJ;
				if (A) {
					let tmp = sid.split('.');
					if (tmp[3].indexOf(A) === tmp[3].length - 1)
						tmp[3] = tmp[3].substr(0, tmp[3].length - 1);
					return tmp.join('.');
				}
				return sid;
			}catch(e){}
		},
		/** 商品切換/更新 */
		onSelectedSymbol() {
			// 從分類表中找出當前 selectedSymbol 的 symbolObj
			let symbolObj = this.getSymbolObj(this.selectedSymbol);
			if (symbolObj) {
				// 設定當前選擇的 symbolObj
				this.updateSymbolObj(symbolObj);
			}
			// 當前 selectedSymbol 找不到對應的分類表時
			else {
				// 預設為第一個交易所的第一檔期權商品 (會透過 watch 自動觸發回來 onSelectedSymbol)
				this.setFirstSymbol();
			}
			let info = this.$store.state.opt.underlyingSInfo = M4C.Symbol.getMainformInfo(this.selectedSymbol);
			if (info) {
				let usid = this.$store.state.opt.underlyingS = info.Underlying.S;
				this.$store.state.opt.underlyingSQO = M4C.Quote.getQuoteObject(usid);
			}
		},
		/** 判別此商品代碼是否為 Option 商品 */
		isOpt(sid) {
			return sid.indexOf("I.O.") === 0;
		},
		// 依複式部位邏輯選用的策略
		strategy(m1, m2, side1, side2, cp1, cp2, strike1, strike2) {
			let result = {key: '', label: '自訂'};			
			// ======================== 1. 不管月份，同 strike，同 CP，不同 BS========================
			if(strike1 == strike2 && cp1 == cp2 && side1 != side2) {
				// 'StDiffTime':		// 時間價差
				result = {key: 'StDiffTime', label: '時間價差'};
			}
			// ======================== 2. 同月份 ========================
			if(m1 == m2) {
				// ======================== 2.1. 不同 BS ========================
				if(side1 != side2) {
				// ======================== 2.1.1. CC ========================
					if(cp1 == 'C' && cp2 == 'C') {
						// BUY 的 strike 小
						if((side1 == 'BUY' && strike1 < strike2) || (side2 == 'BUY' && strike2 < strike1)) {
							// 'BullCallSpread':	// 多頭價差(C)
							result = {key: 'BullCallSpread', label: '多頭價差 (C)'};
						}
						// BUY 的 strike 大
						else if((side1 == 'BUY' && strike1 > strike2) || (side2 == 'BUY' && strike2 > strike1)) {
							// 'BearCallSpread':	// 空頭價差(C)
							result = {key: 'BearCallSpread', label: '空頭價差 (C)'};
						}
					}
					// ======================== 2.1.2. PP ========================
					else if(cp1 == 'P' && cp2 == 'P') {
						// BUY 的 strike 小
						if((side1 == 'BUY' && strike1 < strike2) || (side2 == 'BUY' && strike2 < strike1)) {
							// 'BullPutSpread':	// 多頭價差(P)
							result = {key: 'BullPutSpread', label: '多頭價差 (P)'};
						}
						// BUY 的 strike 大
						else if((side1 == 'BUY' && strike1 > strike2) || (side2 == 'BUY' && strike2 > strike1)) {
							// 'BearPutSpread':	// 空頭價差(P)
							result = {key: 'BearPutSpread', label: '空頭價差 (P)'};
						}
					}
				}
				// ======================== 2.2. 不同 CP，同 BS ========================
				if(cp1 != cp2 && side1 == side2) {
					// ======================== 2.2.1. 同 strike ========================
					if(strike1 == strike2) {
						// BB
						if(side1 == 'BUY') {
							// 'BuyStraddles':	// 買進跨式
							result = {key: 'BuyStraddles', label: '買進跨式'};
						}
						// SS
						else if(side1 == 'SELL') {
							// 'SellStraddles':	// 賣出跨式
							result = {key: 'SellStraddles', label: '賣出跨式'};
						}
					}
					// ======================== 2.2.2. 不同 strike ========================
					else {
						// BB
						if(side1 == 'BUY') {
							// 'BuyStrangles':	// 買進勒式
							result = {key: 'BuyStrangles', label: '買進勒式'};
						} 
						// SS
						else if(side1 == 'SELL') {
							// 'SellStrangles':	// 賣出勒式
							result = {key: 'SellStrangles', label: '賣出勒式'};
						}
					}
				}
				// ======================== 2.3.同 strike && 不同 CP && 不同 BS ========================
				if(strike1 == strike2 && cp1 != cp2 && side1 != side2) {
					// ======================== 2.3.1. P 的為 B ========================
					if(side1 == 'BUY' && cp1 == 'P' || side2 == 'BUY' && cp2 == 'P') {
						// 'Conversions':	// 轉換
						result = {key: 'Conversions', label: '轉換'};
					}
					// ======================== 2.3.2. P 的為 S ========================
					if(side1 == 'SELL' && cp1 == 'P' || side2 == 'SELL' && cp2 == 'P') {
						// 'Reversals':		// 逆轉
						result = {key: 'Reversals', label: '逆轉'};
					}
				}
			}			
			return result;
		},
	},
	watch: {
		/** 商品切換 */
		selectedSymbol(nv) {
			this.onSelectedSymbol();
		},
		/** 期權分類表完成 */
		'$store.state.status.existOpt'(nv) {
			if (nv) this.onSelectedSymbol();
		},
		'$store.state.opt.underlying.F'(nv) {
			// 更新當前是否選到 期貨期權
			this.$store.state.opt.isFeatureOption = this.underlying.F.indexOf("_U") === -1 && this.underlying.S === this.underlying.F;
		},
	},
    computed: {
		/** 當前選擇商品代號 */
		selectedSymbol() {
			return this.$store.state.opt.selectedSymbol;
		},
		underlying() {
			return this.$store.state.opt.underlying;
		},
		underlyingSid() {
			let result = vuex.selectedSymbol.ID;
			// 期貨期權
			if (this.isFeatureOption) {
				try {
					let sid = vuex.selectedSymbol.ID;
					let minfo = M4C.Symbol.getMainformInfo(sid);
					let month = (sid.split('.')[4]).substr(0,6);
					if (minfo.Underlying)
						result = `${minfo.Underlying.F}.${month}`;
				}
				catch(e){}
			}
			// 個股期權
			else {
				result = vuex.opt.underlying.S;
			}
			vuex.opt.underlyingSid = result;
			return result;
		},
		// 是期貨期權
		isFeatureOption() {
			return this.$store.state.opt.isFeatureOption;
		},
	},
}
</script>
