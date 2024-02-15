<template>
    <div class="search-ctn flex-column">
		<div class="body flex-1" :class="[$store.state.status.isPortrait?'flex-col':'flex-row']">
			<div class=" flex-col pd5">
				<div class="search-input-ctn flex-center">
					<input ref="searchInput" :class="{'search-pdl': searchText===''}" class="font-size-big search-input clr-white pdtb3 pdlr2 rd1" v-model="searchText"
						type="text" :placeholder="$ln(`请输入关键字`)" @input="searchTextLimit">
					<i class="material-icons search-icon" v-if="searchText===''">search</i>
					<i class="material-icons clear-icon" v-if="searchText!==''" @click="searchText=''">clear</i>
				</div>
				<div class="flex-1" v-if="searchResultList.length == 0">
					<div class="history-ctn">
						<div class="font-size-big clr-gray mgtb5">{{$ln('搜寻历史')}}</div>
						<div class="history-item-ctn flex-item flex-wrap" v-stop-propagation-y>
							<span class="history-item flex-center mgr3 bgc-head" v-for="txt in historyList" @click="onHistoryClick(txt)" v-if="txt">{{txt}}</span>
						</div>
					</div>
				</div>

			</div>
			<div class="flex-1 posr font-size-little">
				<div class="FULL flex-col p10 scrolling-y" v-stop-propagation-y
					v-if="posFilterResultList.length > 0 || selfGroupResultList.length > 0 || searchResultList.length > 0">
					<div class="flex-col" v-if="posFilterResultList.length > 0">
						<div class="font-size-mini clr-gray2 mlr10">{{$ln('持仓')}}</div>
						<div class="tcef result-line mgtb1 mgl5 mgr3 pdtb2 pdl2" v-for="obj in posFilterResultList" @click="onContractClick(obj.SYMBOL)">
							<span>{{getSymbol(obj.SYMBOL)}}</span>
						</div>
					</div>
					<div class="flex-col mgtb3" v-if="selfGroupResultList.length > 0">
						<div class="font-size-mini clr-gray2 mlr10">{{$ln('自选')}}</div>
						<div class="tcef result-line mgtb1 mgl5 mgr3 pdtb2 pdl2" v-for="sid in selfGroupResultList" @click="onContractClick(sid)">
							<span>{{getSymbol(sid)}}</span>
						</div>
					</div>
					<div class="flex-col" v-if="searchResultList.length > 0">
						<div class="font-size-mini clr-gray2 mlr10">{{$ln('全部')}}</div>
						<div class="tcef result-line flex-row mgtb1 mgl5 pdtb2 pdl2" v-for="obj in searchResultList">
							<div @click="onContractClick(obj.sid)">
								<span class="mgr2">{{obj.exgName}}</span>
								<span>{{obj.sidName}}</span>
							</div>
							<div class="flex-1"/>
							<FavoriteIcon class="icon-btn fav-icon mglr3" :symbol="obj.sid" />
						</div>
					</div>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
export default {
	data() {
		return {
			/** 搜尋商品Input */
			searchText: '',
			/** 搜尋結果Array */
			searchResultList: [],
			historyList: [],
			/** 持倉過濾結果Array */
			posFilterResultList: [],
			/** 自選過瀘結果Array */
			selfGroupResultList: [],
        }
	},
	props:['param'],
	beforeMount() {},
    mounted() {
		// 僅首次需分析
		if (this.symbolObjList.length === 0) {
			// 解析分類表至做出以商品單位扁平的列表
			let classification = M4C.Symbol.classification;
			for (let key in classification) {
				// 必須在 pdsetting.function.search.classification 裡有宣告的才搜尋
				if (this.searchClassification.indexOf(key) !== -1) {
					classification[key].forEach((exgObj)=>{
						this.getContracts(exgObj);
					});
				}
			}
		}
		// 初始化持倉顯示資料
		// this.posFilterResultList = this.$store.state.data.normalPositionSumList;
		// 初始化自選顯示資料
		// this.selfGroupResultList = this.selfGroupList;
		
		this.storageKey = `${this.$store.state.config.projectID}_SEARCH_HISTORY`;
		let historyContent = localStorage.getItem(this.storageKey);
		if (historyContent) {
			this.historyList = JSON.parse(historyContent);
		}
		// 桌機版才執行自動focus(app會有背景殘影)
		if(this.isDesktop)
			this.$refs.searchInput.focus();
	},
	beforeDestroy() {},
	components: {},
    methods:{
		getSymbol(sid){
            return M4C.Symbol.getCNM4(sid);
        },
		getContracts(symbolObj){
			let self = this;
			// 仍是 Node 時繼續往下探
			if (symbolObj.Node) {
				symbolObj.Node.forEach((_symbolObj)=>{
					this.getContracts(_symbolObj);
				});
			}
            // 有合約資料才處理 (指數不處理，因指數合約是包含某交易所下的所有商品指數，而這些指數已經包含在各商品內)
            else if(symbolObj.Contracts && symbolObj.ENG != 'FutIndex00' && symbolObj.ENG !== 'HOT'){
				self.symbolObjList.push(symbolObj);
				let sid = symbolObj.Contracts[0];
				let ids = sid.split('.');
				// $LABEL = "超長10年債|CBOT.TN"
				// symbolObj.$LABEL = `${symbolObj[self.$store.state.lang.mainformLangKey]}|${ids[2]}.${ids[3]}`;
				symbolObj.$LABEL = `${M4C.Symbol.getContractName(sid)}|${ids[2]}.${ids[3]}|${symbolObj.ENG}`;
			}
			// 熱門月處理
			else if(symbolObj.Contracts && symbolObj.ENG === 'HOT') {
				symbolObj.Contracts.forEach(sid => {
					let ids = sid.split('.');
					let _symbolObj = {
						$LABEL: `${M4C.Symbol.getContractName(sid)}|${ids[2]}.${ids[3]}.HOT|热门月`,
						Contracts: [M4C.Symbol.toHotSymbol(sid)]
					}
					self.symbolObjList.push(_symbolObj);
				});
			}
		},
		// 儲存本次搜尋內容
		storeSearchHistory(){
			if (this.historyList.indexOf(this.searchText) == -1) {
				this.historyList.unshift(this.searchText);
				// 數量限制
				this.historyList.slice(0, 9);
				localStorage.setItem(this.storageKey, JSON.stringify(this.historyList));
			}
		},
		/** 點擊搜尋結果合約 */
		onContractClick(sid) {
			// 儲存搜尋記錄
			this.storeSearchHistory();
			// 設定v-model值。
			if(typeof this.param.setSid === 'function') {
				this.param.setSid(sid);
			}
			// 沒參數或參數中沒有lock值才設定selectedSymbol
			if(!this.param || !this.param.lock){
				// 設定關注商品
				this.$store.commit("setSelectedSymbol", sid);
				// 如果是熱門月額外設定顯示
				if(sid.split('.').indexOf('HOT') >= 0) {
					this.$store.commit("setSelectedSymbolDisplayAsHot");
				}
			}
			// 關閉本畫面
			eventBus.$emit("CLOSE-DIALOG");
			// app版才彈出商品行情頁
			if((!this.param || !this.param.isStopSub) && !this.isDesktop && this.param.from!=='ContractsSwitch'){
				// 執行彈出商品行情頁。
				setTimeout(() => {
					eventBus.$emit("POPUP-DIALOG", "QuotePage");
				}, 10);
			}
		},
		/** 歷史記錄被點擊 */
		onHistoryClick(txt) {
			this.searchText = txt;
			this.$refs.searchInput.focus();
		},
		// 搜尋文字輸入限制
		searchTextLimit() {
			// 帳號限制英數字
			this.searchText = this.searchText.replace(/[^\a-\z\A-\Z0-9\u4E00-\u9FA5]/g, '');
			// 限制長度 12 碼
			this.searchText = this.searchText.length > 12 ? this.searchText.substr(0,12) : this.searchText;
		},
	},
	watch: {
		searchText: function(nv) {
			let self = this;
			eventBus.$emit("IPTCHANGE");
			// console.time("search-cost");
			self.searchResultList = [];
			self.hotFilterResultList = [];
			if (nv.length <= 0) {
				// 無搜尋文字時顯示全持倉資料。
				this.posFilterResultList = [];//this.$store.state.data.normalPositionSumList;
				this.selfGroupResultList = [];//this.selfGroupList;
				return
			};
			let inputList = nv.split(' ');
			// 搜尋輸入的文字部分(array)
			let inputTxtList = inputList.filter((text)=>{return isNaN(text);});
			// 搜尋輸入的數字部分(array)
			let inputNumList = inputList.filter((text)=>{return !isNaN(text);});
			if (inputTxtList.length > 0 || inputNumList.length > 0) {
				// 在商品層級開始過濾
				let filteredList = self.symbolObjList.filter((symbolObj)=>{
					// console.log(symbolObj.$LABEL);
					// 多個輸入詞 (空白分隔) 是否全部符合
					let result = inputTxtList.filter((text)=>{
						text = text.toLowerCase()
						// 忽略大小寫，逐項看是否符合輸入詞
						return symbolObj.$LABEL.toLowerCase().indexOf(text) != -1
					});
					// 過濾後結果一致時，表示所有輸入詞都有被包含
					return result.length === inputTxtList.length && result.length;
				});
				if(filteredList.length){
					// 商品層級過濾後的結果
					filteredList.forEach((symbolObj)=>{
						let contractList = symbolObj.Contracts;
						// 支持輸入數字過濾月份
						if (inputNumList.length > 0) {
							contractList = contractList.filter((sid)=>{
								return sid.indexOf(inputNumList[0]) != -1;
							});
						}
						// 全部過濾完成之後的結果
						contractList.forEach((sid)=>{
							let isHot = sid.split('.').slice(-1)[0] === "HOT";
							let _sidName = isHot? M4C.Symbol.getCNameCIDHot(sid) : M4C.Symbol.getCNameCIDM4(sid, " ");
							self.searchResultList.push({
								sid: sid,
								exgName: M4C.Symbol.getExchangeName(sid),
								sidName: _sidName,
							});
						});
					});
				}
				// 商品層級搜尋沒有結果，直接以數字搜尋關鍵字
				else if(inputNumList.length) {
					filteredList = self.symbolObjList.filter((symbolObj)=>{
						// 多個輸入詞 (空白分隔) 是否全部符合
						let result = inputNumList.filter((text)=>{
							// 逐項看是否符合輸入詞
							return symbolObj.$LABEL.indexOf(text) != -1
						});
						// 過濾後結果一致時，表示所有輸入詞都有被包含
						return result.length === inputNumList.length && result.length;
					});
					filteredList.forEach((symbolObj)=>{
						let contractList = symbolObj.Contracts;
						// 全部過濾完成之後的結果
						contractList.forEach((sid)=>{
							let isHot = sid.split('.').slice(-1)[0] === "HOT";
							let _sidName = isHot? M4C.Symbol.getCNameCIDHot(sid) : M4C.Symbol.getCNameCIDM4(sid, " ");
							self.searchResultList.push({
								sid: sid,
								exgName: M4C.Symbol.getExchangeName(sid),
								sidName: _sidName,
							});
						});
					})
				}
			}
			// 庫存資料過濾
			let posFilterList = this.$store.state.data.normalPositionSumList.filter(pos => {
				let isInList = self.searchResultList.filter(ser => ser.sid === pos.SYMBOL);
				return isInList.length > 0;
			});
			// 重新指定持倉顯示資料
			this.posFilterResultList = posFilterList;
			// 自選資料過濾
			let selfGroupFilterList = this.selfGroupList.filter(sid =>{
				let isInList = self.searchResultList.filter(ser => ser.sid === sid);
				return isInList.length > 0;
			});
			// 重新指定自選顯示資料
			this.selfGroupResultList = selfGroupFilterList;
			this.searchResultList = this.searchResultList.slice(0,50);
			
			// console.log("搜寻结果数量 : ", this.searchResultList.length);
			// console.timeEnd("search-cost");
		}
	},
    computed: {
		// 不重複的自選群組sid陣列
		selfGroupList(){
			let selfGroupSidMap = {};
			this.$store.state.data.ssgList.map((group) =>{
				group.param.map(sid=>{
					selfGroupSidMap[sid] = sid;
				});
			});
			return Object.keys(selfGroupSidMap);
		},
		symbolObjList() {
			return this.$store.state.search.symbolObjList;
		},
		/** 由 pdsetting 指定要搜尋的分類表 (不在這裡面的不搜尋) */
		searchClassification() {
			let fn = this.$store.state.config.quotePdSetting.function;
			return fn && fn.search && fn.search.classification ? fn.search.classification : [];
		},
		isDesktop() {return this.$store.state.device.isDesktop;},
	}
}
</script>

<style scoped>
.search-icon {
	position: absolute;
	left: 1.2em;
	color: gray;
}
.clear-icon {
	position: absolute;
	right: 1.2em;
}
.search-input {
	border: 1px solid #2F3133;
	width: 100%;
	background-color: rgba(0,0,0,0);
}
.search-pdl {
	padding-left: 2em;
}
.history-item {
	padding: 6px 10px;
    background-color: #0065A4;
    border-radius: 8px;
}
.result-line:focus {
	background-color: #0065A4;
}
.result-line:hover {
	background-color: #0065A4;
}
.icon-btn {
	width: 16px;
	height: 16px;
}
.icon-btn /deep/ i.material-icons {
	font-size: 16px !important;
}
.desktop .result-line {
	margin: 0.1em 0.5em;
	padding: 0.1em 0.5em;
}

@media screen and (orientation: landscape) {
	.history-item-ctn{
		display: flex;
		flex-flow: wrap;
		overflow: auto;
	}
}
</style>