<template>
	<div class="margin-ctn" :class="{'flex-col': !flexWrap, 'flex-row flex-wrap':flexWrap}">
		<div v-if="!flexWrap && existData" class="flex-row line" v-for="(obj, key) in marginColumn" :key="key" :class="{'mgtb2': isDesktop}">
			<div class="flex-1 flex-start column-label clr-gray font-size-small"><span class="ellipsis" :key="obj.TXT">{{$ln(obj.TXT)}}</span></div>
			<div class="flex-end column-value font-size-little" :class="[moreClass(obj, key)]" :data-key="key">{{format(obj, allMarginData[currency][key])}}</div>
		</div>
		<div v-if="flexWrap && existData" class="flex-col margin-info-card flex-center pdtb3" v-for="(obj, key) in marginColumn" :key="key">
			<span class="column-label flex-center pdtb1 nowrap">{{$ln(obj.TXT)}}</span>
			<span class="column-value font-size-xl pdtb1 flex-center flex-1">{{format(obj, allMarginData[currency][key])}}</span>
		</div>
		<Stamp v-if="!existData" :stampStatus="stampStatus" :stampStyle="stampStyle"/>
	</div>
</template>

<script>
export default {
	props: ['param', 'stampStyle', 'flexWrap'],
	data() {
		return {
			// 資金欄位定義
			// marginColumn: this.$store.state.config.CONFIG.MarginColumn,
        }
	},
    methods: {
		format(obj, str) {
			let val;
			if (obj.ISPERCENT) {
				val = parseFloat(str).toFixed(2);
				return isNaN(val) ? `--` : `${val}%`;
			}
			val = parseFloat(str).toFixed(obj.DLEN || 0);
			return isNaN(val) ? '--' : this.$commas(val);
		},
		onRefresh() {
			M4C.Margin.queryMargin();
		},
		moreClass(obj, key) {
			if (obj.CLR0) {
				let val = this.allMarginData[this.currency][key];
				return this.$clr0(val);
			}
		},
		// 根據帳號類型調整平倉盈虧顯示文字。
		modifyConfigByAccountType(config, key) {
			if(key == 'REALIZED_PL') {
				// 模擬帳號或混合委託權限帳號。
				if(this.isSIM || this.isMixTypeAccount)
					config.TXT = '平仓盈亏 :';
				// 純證券帳號
				else if(this.isStock && !this.isFut && !this.isOption)
					config.TXT = '证券平仓盈亏 :';
				// 純期货帳號
				else if(!this.isStock && this.isFut && !this.isOption)
					config.TXT = '期货平仓盈亏 :';
				// 純期权帳號
				else if(!this.isStock && !this.isFut && this.isOption)
					config.TXT = '期权平仓盈亏 :';
			}
			return config;
		},
		gerPurchaseLimit(){return this.isPurchaseLimit;},
	},
	computed: {
		isDesktop() {return this.$store.state.device.isDesktop;},
		$clr0() {return this.$store.state.fn.$clr0;},
		$commas() {return this.$store.state.fn.$commas;},
		// 本資金元件的幣別
		currency() {
			return this.param || this.$store.state.status.selectedCurrency;
		},
		// 本幣別是否有資料
		existData() {
			let thisCurrencyData = this.allMarginData[this.currency];
			// 任一欄位有值(包含0)就視為有資料
			for (let key in thisCurrencyData) {
				if (thisCurrencyData[key] != null)
					return true;
			}
		},
		isPurchaseLimit() {
			try{
				return this.allMarginData[this.currency].PURCHASE_LIMIT;
			} catch(e) {return false};
		},
		// 以幣別為 key 的響應式資金資料
		allMarginData() {
			return this.$store.state.data.marginData;
		},
		/** MarginResult.$STATUS */
		stampStatus() {
			return this.$store.state.result.queryMarginResult.$STATUS;
		},
		// 資金欄位定義
		marginColumn() {
			let config = {};
			for(let key in this.$store.state.config.CONFIG.MarginColumn){
				if(!this.enableRiskControl && (key == "DELTA" || key == "GAMMA"))
					continue;
				// 不是期權帳號且不是SIM帳號不顯示權利金收支
				else if((!this.isOption && !this.isSIM) && (key == 'PREMIUM_NET'))
					continue;
				// 不是證券帳號或是SIM帳號(目前SIM不能下證券單)不顯示證券資金收支
				else if((!this.isStock || this.isSIM) && key == 'STOCK_PL')
					continue;
				else {
					let configObj = this.$store.state.config.CONFIG.MarginColumn[key];
					config[key] = this.modifyConfigByAccountType(configObj, key);
				}
			}
			return config;
		},
		// 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
		// 是否支援風控功能(https://trello.com/c/kHPjql5q/)
		enableRiskControl() {
			try{return this.$store.state.config.tradePdSetting.broker.enableRiskControl;}catch(e){}
		},
		isStock() {return this.$store.state.login.isStock;},
		isFut() {return this.$store.state.login.isFut;},
		isOption() {return this.$store.state.login.isOption;},
		isSIM() {return this.$store.state.login.isSIM;},
		// 混合委託權限帳號
		isMixTypeAccount() {
			let mixCount = 0;
			// 證券委託權限
			if(this.isStock) mixCount++;
			// 期貨委託權限
			if(this.isFut) mixCount++;
			// 期權委託權限
			if(this.isOption) mixCount++;
			// 回傳是否為混合兩種委託類型的權限
			return mixCount > 1;
		},
	}
}
</script>

<style scoped>
.line {
	min-height: 30px;
}
.column-label {
	width: 100px;
}
.margin-info-card {
	font-weight: bold;
	width: 10em;
	height: 5em;
}
.purchase-limit-lable {
	min-width: 4em;
}
/* 桌機版 */
.desktop .line {
	padding: 0 1em;
}
.desktop .column-label{min-width: 0;}
.ellipsis {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>