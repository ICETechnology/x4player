<template>
	<SingleSelect class="w100p" :options="orderTypeOptions" v-model="orderTypeObj" :orderType="cmp ? cmp.orderType : ''"/>
</template>

<script>
export default {
	props: ['symbol', 'param'],
	data() {
		return {
			orderTypeObj: {},
			orderTypeOptions: [],
		}
	},
	beforeMount() {
		// 支持台灣模式，上層未指定委託別時，預設在 LIMIT/ROD
		if (this.twMode && this.param && !this.param.orderType)
			this.param.orderType = "LIMIT";
	},
    mounted() {
		// 一次性取得 options 而不再使用 compute (以免 compute 來源有用到 option change 後的結果，會導致異常)
		this.orderTypeOptions = this.getOrderTypeOptions();
	},
	beforeDestroy() {},
	components: {},
    methods: {
		// 取得委託別物件選單
		getOrderTypeOptions() {
			let optionList = [];
			// 以 UFX 為例，若 OrderTypes.UFX 不存在時，使用 OrderTypes.default
			let odObjList = this.exgOrderTypes[this.brokerSystem] || this.exgOrderTypes.default;
			if (Array.isArray(odObjList)) {
				odObjList.forEach((odObj)=>{
					let orderType = odObj.name;
					let label = this.$store.state.config.mapOrderTypeLabel[orderType];
					let selected = this.param && this.param.orderType == orderType && !this.param.dcore? true: false;
					if (label) optionList.push({label: label, value: {orderType: orderType, dcore: false}, selected: selected});
				});
			}
			// 一般下單盒不包含雲端洗價委託別 (不要包含 OrderTypes.DCORE 的設定)
			if (this.orderBoxMode === 0)
				return optionList;
			// 雲端洗價委託別
			odObjList = this.exgOrderTypes.DCORE;
			if (Array.isArray(odObjList) && this.isAgreeSMO) {
				odObjList.forEach((odObj)=>{
					let orderType = odObj.name;
					let label = this.$store.state.config.mapOrderTypeLabel[orderType] + ' ' + this.$ln('(云)');
					let selected = this.param && this.param.orderType == orderType && this.param.dcore? true: false;
					if (label) optionList.push({label: label, value: {orderType: orderType, dcore: true}, selected: selected});
				});
			}
			return optionList;
		},		
	},
	watch: {
		orderTypeObj(nv) {
			this.$store.state.order.orderType = nv.orderType;
			this.$store.state.order.orderTypeFromDCore = nv.dcore;
		},
	},
    computed: {
		twMode() {
			return this.$store.state.config.twMode;
		},
		sid() {return this.symbol || this.$store.state.selectedSymbol.ID;},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		brokerInfo() {
			return this.$store.state.brokerMap[this.brokerID] || {};
		},
		brokerSystem() {
			return this.brokerInfo.system || 'default';
		},
		// 交易所層級的總表
		exgOrderTypes() {
			try{return M4C.Symbol.getMainformInfo(this.sid.split('.').slice(0,3).join('.')).OrderTypes;}catch(e){return {};}
		},
		/** 當前選取的委託別 */
		orderType() {
			return this.$store.state.order.orderType;
		},
		// 下單盒模式 (0:普通, 1:高級)
		orderBoxMode() {
			return this.$store.state.config.orderBoxMode;
		},

		pdsettingConvertMarketPrice() {
			try{return this.$store.state.config.quotePdSetting.function.convertMarketPrice;}catch(e){}
		},
		// convertMarketPrice object
		cmp() {
			let cmp;
			if (this.orderType === 'MARKET') {
				// 優先抓取該交易所 user 的設定
				let exgId = this.sid.split('.').slice(0,3).join('.');
				cmp = this.$store.state.convertMarketPrice[exgId];
				// 不存在設定時，使用 pdsetting 的預設
				try{cmp = cmp || this.pdsettingConvertMarketPrice.find(obj=>obj.exgId===exgId).orderTypeList[0];}catch(e){}
				if (cmp && !cmp.jumps)
					this.$set(cmp, 'jumps', 0);
				if (cmp && !cmp.timeInForce)
					this.$set(cmp, 'timeInForce', cmp.timeInForceList[0]);
			}
			return this.$store.state.order.convertMarketPrice = cmp;
		},
		/** 是否有簽署雲端條件單同意書 */
		isAgreeSMO() {
			return M4C.SmoAgreement.checkAgreeSMO();
		},
	},
}
</script>

<style scoped>
.order-type-selector-ctn {
	color: black;
	background-color: white;
	border-radius: 2vw;
	height: 18vw;
}
.order-type-selector-ctn .selected {
	background-color: #F5A623;
	border-radius: 2vw;
}
</style>