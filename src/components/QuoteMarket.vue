<!-- 包含所有交易所頁簽的行情元件 -->
<template>
    <div class="flex-col quote-market-ctn">
		<TabGroup ref="tg" class="" :tabList="tabList" :selectedIdx="selectedIdx" @onActiveTab="onActiveTab" :disablePrevNext="quoteStyle==='QuoteTableX'"
			:hiddenTab="true" :tabKey="`${$store.state.status.isPortrait?'TG-QMC':'TG-QTL'}`" :suspend="suspend"></TabGroup>
		<QuoteCardSDHeight />
    </div>
</template>

<script>
import QuoteMarketContentList from "@/components/QuoteMarketContentList.vue";
import QuoteTable from "@/components/QuoteTable.vue";
import QuoteTableX from "@/components/QuoteTableX.vue";
import MultiStockRow from "@/components/MultiStockRow.vue";
export default {
	props: ["suspend"],
	data() {
		return {
			selectedIdx: 0,
			// childClass: this.$store.state.status.isPortrait ? QuoteMarketContentList : QuoteTable,
			// childClass: QuoteMarketContentList,
			// 特定主力合约交易所(依期望顺序排列)
			hotExg: ["CFFEX", "SHFE", "DCE", "CZCE", "INE"],
		}
	},
	beforeMount() {
		let self = this;
		let tabID = this.$store.state.status.quoteTabID;
		this.selectedIdx = this.tabList.findIndex(obj => obj.param.id === tabID);
		// 所有的 tab 都沒有包含指定的 tab (ex. 上一次停留的交易所，本次不存在時)
		if (this.selectedIdx == -1) {
			tabID = M4C.Symbol.firstFExgID;
			this.$store.commit("setQuoteTabID", tabID);
			this.selectedIdx = this.tabList.findIndex(obj => obj.param.id === tabID);
		}
	},
    mounted() {	
		// 新手教學
		eventBus.$emit("HEPLER", "market");
		// 預設塞一個關注合約 (讓 QuoteCardSDHeight 能順利拿到高度)
		if (!this.$store.state.selectedSymbol.ID) {
			try {
				let sid = this.tabList[this.selectedIdx].param.expandList[0].sid;
				this.$store.commit("setSelectedSymbol", sid);
			}catch(e){}
		}
	},
	beforeDestroy() {
		// 清空關注合約列表
		// this.$store.state.status.curContractsList = [];
	},
	components: {
		QuoteMarketContentList,
		QuoteTable,
		QuoteTableX,
		MultiStockRow,
	},
    methods:{
		onActiveTab(obj) {
			this.$store.commit("setQuoteTabID", obj.tab.param.id);
		},
		/** 切至當前選中的頁簽 */
		syncTab(tabID) {
			let selectedIdx = this.tabList.findIndex(obj => obj.param.id === tabID);
			this.$refs.tg.onTabClick(selectedIdx);
		},
		/**
		 * expandList 格式：
		 * [{'sid': sid, 'moreContracts': ['sid1', 'sid2', ...]}]
		 */
		/** exgNode 轉 ExpandList
			exgNode = 分類表中此 [交易所] 的 Node 內容 ex.
			[{
				"ENG": "HOT",
				"CHT": "熱門月",
				"CHS": "热门月",
				"Contracts": ["I.F.CBOT.TN.201912", "I.F.CBOT.UB.201912", "I.F.CBOT.XC.201912", "I.F.CBOT.XK.201911", "I.F.CBOT.XW.202007", "I.F.CBOT.YG.202002", "I.F.CBOT.YI.202003", "I.F.CBOT.YM.201912", "I.F.CBOT.ZB.201912", "I.F.CBOT.ZC.201912", "I.F.CBOT.ZF.201912", "I.F.CBOT.ZL.201912", "I.F.CBOT.ZM.201912", "I.F.CBOT.ZN.201912", "I.F.CBOT.ZO.201912", "I.F.CBOT.ZR.201911", "I.F.CBOT.ZS.201911", "I.F.CBOT.ZT.201912", "I.F.CBOT.ZW.201912"]
			}, {
				"ENG": "Ultra 10-Year U S  Treasury Note",
				"CHT": "超長10年債",
				"CHS": "超长10年债",
				"SYMBOL": "TN",
				"Contracts": ["I.F.CBOT.TN.201912", "I.F.CBOT.TN.202003", "I.F.CBOT.TN.202006"]
			}...]
		**/		
		exgNodeToExpandList(exgNode) {
			let expandList = [];
			let hotContracts = [];
			// 找出熱門月Contracts
			let hotIdx = exgNode.findIndex((obj)=>{
				return obj.ENG==="HOT";
			});
			// 無熱門月情境 ex. 證券, 個股期貨
			if (hotIdx == -1) {
				// 使用最近月作為熱門月
				exgNode.forEach((obj)=>{
					if (obj && obj.Contracts) {
						let hotID = obj.Contracts[1] || obj.Contracts[0];
						hotContracts.push(hotID);
					}
				});
			}
			// 一般正常有熱門月情境
			else {
				// 熱門月的合約列表
				hotContracts = exgNode[hotIdx].Contracts;
				// 沒有對應到 HOT 的品種 (Hot表異常)，也要呈現出來 (push 在最下面) https://trello.com/c/CzBRVlej
				exgNode.forEach((obj)=>{
					if (obj && obj.ENG !== 'HOT' && !obj.hasHot) {
						let sid = obj.Contracts[1] || obj.Contracts[0];
						if (sid)
							hotContracts.push(sid);
					}
				});
			}
			hotContracts.forEach((hotSid)=>{
				try {
					if (!hotSid) return;
					// 找出此熱門月對應的合約列表
					let symbol = hotSid.split('.')[3];
					let idx = exgNode.findIndex((obj)=>{
						return obj.SYMBOL === symbol;
					});
					// 分類表該品種未提供 SYMBOL 欄位時 (ex. 價差期貨) 的補救措施 -> 直接往 Contracts 裡面探查比對
					if (idx === -1) {
						try {
							idx = exgNode.findIndex(obj=>{
								return obj.Contracts[0].split('.')[3] === symbol;
							});
						}catch(e){}
					}
					// 因https://trello.com/c/UWKXHvB3/ 卡片問題(小台w2有在熱門月清單中，但分類表下面沒有小台w2，導致小台w2以熱門月合約清單當展開清單問題)。
					// 註解掉如果沒有找到對應合約表時，以第一個合約表當展開清單。
					// idx = idx === -1 ? 0 : idx;
					// 當沒有找到對應合約表時以空陣列處理。
					let contracts = idx !== -1? exgNode[idx].Contracts: [];
					// 在該商品的合約中過濾掉熱門月
					// contracts = contracts.filter((sid)=>{return sid !== hotSid;});
					expandList.push({
						sid: hotSid,
						moreContracts: contracts,
					});
				}catch(e) {
					console.log('QuoteMarket.exgNodeToExpandList exception : ', hotSid, e.message);
				}
			});

			return expandList;
		},
		/** 合約Sid列表 -> ExpandList */
		contractListToExpandList(contractList) {
			let expandList = [];
			contractList.forEach((sid)=>{
				if (sid) {
					expandList.push({
						sid: sid,
						moreContracts: null,
					});
				}
			});
			return expandList;
		},
	},
	watch: {
		/** 頁簽ID改變切換 */
		quoteTabID(tabID) {
			this.syncTab(tabID);
		},
		tabList() {
			let tabID = this.$store.state.status.quoteTabID;
			this.selectedIdx = this.tabList.findIndex(obj => obj.param.id === tabID);
		}
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		/** 全部頁簽內容 */
		tabList: function() {
			// 庫存自選 + 交易所
			if (this.multiSS)
				return [].concat(this.posTabList).concat(this.selTabList).concat(this.futHotList).concat(this.exgTabList);
			else
				return [].concat(this.focusTabList).concat(this.futHotList).concat(this.exgTabList);
		},
		/** 庫存自選頁簽內容 (響應式 by $store.state.data.normalPositionSumList) */
		posTabList: function() {
			let positionSumContractList = this.$store.state.data.normalPositionSumList.map((pos)=>{
				return pos.SYMBOL;
			});
			return [{
				comClass: this.childClass,
				label: this.$ln(`库存行情`),
				param: {
					'id': 'position',
					'storageKey': 'Position',
					'expandList': this.contractListToExpandList(positionSumContractList)
				},
			}];
		},
		focusTabList() {
			return {
				comClass: this.childClass,
				label: this.$ln('关注'),
				param: {
					'id': "focus",
					'storageKey': `SelfSelect.focus`,
					'expandList': this.contractListToExpandList(this.$store.state.data.focusList),
				}
			};
		},
		/** 自選群組頁簽內容 (響應式 by $store.state.data.ssgList) */
		selTabList: function() {
			return this.$store.state.data.ssgList.map((group, idx) => {
				return {
					comClass: this.childClass,
					label: group.label,
					param: {
						'id': `selfselect.idx.${group.idx || idx}`,
						'storageKey': `SelfSelect.${group.label}`,
						'expandList': this.contractListToExpandList(group.param),
					}
				};
			});
		},

		/** 交易所頁簽內容 (響應式 by M4C.Symbol.getClassification) */
		exgTabList: function() {
			let list = [];
			// 處理TabGroup所需要的資料
			this.classification.forEach((exgItem)=>{
				if (!exgItem) return;
				try {
					if (exgItem.Node) {
						list.push({
							comClass: this.childClass,
							label: exgItem[this.$store.state.lang.mainformLangKey],
							param: {
								'id': exgItem.ENG,
								'expandList': this.exgNodeToExpandList(exgItem.Node)
							},
						});
					}
				}catch(e) {
					console.log('QuoteMarket.exgTabList exception : ', exgItem.ENG, e.message);
				}
			});
			return list;
		},
		/** 分類表內容 */
		classification: function() {
			return M4C.Symbol.getClassification(this.$store.state.config.classification);
		},
		/** 當前選到的頁簽ID */
		quoteTabID() {
			return this.$store.state.status.quoteTabID;
		},
		// 依照指定交易所順序回傳清單
		futHotExgList() {
			let list = [];
			this.hotExg.forEach(exg=>{
				// 過濾特定交易所資料
				let exgItem = this.classification.find(exgObj=>{
						return exgObj.Node && exgObj.ENG == exg;});
				if(exgItem)
					list.push(exgItem);
			})
			return list;
		},
		// 期貨主力合約清單
		futHotList() {
			// 台灣不支持期貨主力合約
			if (this.twMode) return [];
			let list = [{
						comClass: this.childClass,
						label: this.$ln("期货主力合约"),
						param: {
							'id': "FUTHOTLIST",
							'expandList': []
							},
						}];
			// 回傳特定交易所下的各熱門月商品
			this.futHotExgList.forEach((items)=>{
				// 過濾熱門月合約
				let hotItem = items.Node.find(item=> {return item.ENG === "HOT"});
				if (hotItem && hotItem.Contracts){
					hotItem.Contracts.forEach(sid => {
						list[0].param.expandList.push({"sid": sid});
					})
				}
			});
			return list;
		},
		/** 報價卡片類別 */
		quoteStyle() {
			return this.$store.state.config.quoteStyle;
		},
		/** 使用哪一種卡片 */
		childClass() {
			return this.quoteStyle==='QuoteTable' ? QuoteTable : this.quoteStyle==='QuoteTableX'? QuoteTableX: 
			this.quoteStyle==='MultiStockRow'? MultiStockRow: QuoteMarketContentList;
		},
		// 啟用多組自選機制
		multiSS() {
			return this.$store.state.config.publicPdSetting.function.multiSS;
		},
    }
}
</script>

<style>
.quote-market-ctn {

}
</style>