<template>
    <div class="flex-row">
		<!-- 交易所下拉選單 -->
		<span class="custom-dropdown">
			<select ref="exgSelect" @change="onSelectExgChange">
				<option v-for="obj in exgList" :value="obj.id" :selected="obj.id===exgID">{{obj.name}}</option>
			</select>
		</span>
		<!-- 商品下拉選單 -->
		<span class="custom-dropdown" v-show="hasHot">
			<select ref="symSelect" @change="onSelectSymChange">
				<option v-for="obj in symList" :value="symKey(obj)" :selected="symKey(obj)===symID">{{obj[langCode]}}</option>
			</select>
		</span>
    </div>
</template>

<script>
export default {
	props: ['ucid'],
	data() {
		return {
			storageKey: `${this.$store.state.config.projectID}_DESKTOP_EXGSYMBOL_SELECTOR_${this.ucid}`,
			symID: '',
			hasHot: true,
		}
	},
	beforeMount() {
		this.symID = localStorage.getItem(this.storageKey);
	},
    mounted() {
		// 送出合約列表
		this.emitContractList();
		// emit 當前選擇的類別，讓上層得以判斷是否選在熱門月
		this.$emit('symbolChange', this.$refs.symSelect.value);
	},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 交易所選單改變 */
		onSelectExgChange(e) {
			this.$store.commit("setQuoteTabID", e.target.value);
			this.$refs.symSelect.selectedIndex = 0;
			this.emitContractList();
		},
		/** 商品選單改變 */
		onSelectSymChange(e) {
			// 儲存最後選擇的商品
			localStorage.setItem(this.storageKey, e.target.value);
			this.emitContractList();
			// emit 當前選擇的類別，讓上層得以判斷是否選在熱門月
			this.$emit('symbolChange', e.target.value);
		},
		/** 送出合約列表 */
		emitContractList() {
			let exgIdx = this.$refs.exgSelect.selectedIndex;
			// 判斷當前交易所是否有熱門月分類表
			let exgNode = this.exgList[exgIdx].exgNode;
			this.hasHot = exgNode.findIndex(obj=>obj.ENG==="HOT") !== -1;
			// 無熱門月情境 ex. 證券, 個股期貨
			if (!this.hasHot) {
				// 蒐集此交易所底下所有合約
				let contracts = [];
				exgNode.forEach(obj=>{contracts = contracts.concat(obj.Contracts)});
				this.$emit('contractList', contracts);
			}
			else {
				let symIdx = this.$refs.symSelect.selectedIndex;
				if (this.symList[symIdx] && this.symList[symIdx].Contracts)
					this.$emit('contractList', this.symList[symIdx].Contracts);
			}
		},
		symKey(obj) {
			return obj.SYMBOL || obj.ENG;
		},
	},
	watch: {
		// symList(nv) {
		// 	this.emitContractList();
		// },
	},
    computed: {
		exgID() {
			return this.$store.state.status.quoteTabID;
		},
		/** 分類表內容 響應式 by M4C.Symbol.getClassification */
		classification() {
			return M4C.Symbol.getClassification(this.$store.state.config.classification);
		},
		/** 交易所內容 響應 by classification */
		exgList() {
			let list = [];
			// 處理TabGroup所需要的資料
			this.classification.forEach((exgItem)=>{
				if (exgItem.Node) {
					list.push({
						id: exgItem.ENG,
						name: exgItem[this.$store.state.lang.mainformLangKey],
						exgNode: exgItem.Node,
					});
				}
			});
			return list;
		},
		symList() {
			let exgItem = this.classification.find(o=>o.ENG===this.exgID);
			return exgItem.Node.filter(o=>o.ENG !== 'FutIndex00');
		},
		langCode() {
			return window.mainformLangKey;
		},
	},
}
</script>

<style scoped>
</style>