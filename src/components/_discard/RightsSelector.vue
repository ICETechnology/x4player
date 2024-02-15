<template>
	<div class="trading-selector-ctn flex-col">
		<MyHead class="head" :backType="1" :acc-btn=false :showText="$ln(`帐务`)" :margin="false"></MyHead>
		<div class="flex-1 mg5 posr font-size-small">
			<div class="FULL flex-col">
				<label class="clr-gray font-bold">{{$ln('资金币别')}}</label>
				<div class="flex-row list-block">
					<Button	class="btn" v-for="currencyID in availableCurrency" @click="onBtnClick(currencyID)"
						:class="{'selected': $store.state.status.rightsTabID === currencyID}">{{$ln(getCurrencyName(currencyID))}}</Button>
				</div>
				<div class="flex-col" v-if="$store.state.config.CONFIG.ENABLE_WARRANT">
					<label class="clr-gray font-bold">{{$ln('备兑')}}</label>
					<div class="flex-row list-block">
						<Button	class="btn" @click="onBtnClick(`Warrant`)"
							:class="{'selected': $store.state.status.rightsTabID === 'Warrant'}">{{$ln(`备兑锁定与解锁`)}}</Button>
					</div>
				</div>
				<div class="flex-col" v-if="$store.state.config.CONFIG.ENABLE_EXERCISE">
					<label class="clr-gray font-bold">{{$ln('行权')}}</label>
					<div class="flex-row list-block">
						<Button	class="btn" @click="onBtnClick(`ExerciseRecord`)"
							:class="{'selected': $store.state.status.rightsTabID === 'ExerciseRecord'}">{{$ln(`行權记录`)}}</Button>
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
			// 以幣別為 key 的響應式資金資料
			allMarginData: M4C.Margin.getMarginData(),
		};
	},
	created() {},
	components: {},
	mounted() {},
	methods: {
		onBtnClick(tabID) {
			console.log(`RightsSelector.tabID : `, tabID);
			this.$store.state.status.rightsTabID = tabID;
			eventBus.$emit("CLOSE-DIALOG");
		},
		getCurrencyName(currencyID) {
			return this.$store.state.config.currencyMap[currencyID].label;
		}
	},
	computed: {
		/** 取得有值的幣別 */
		availableCurrency() {
			let list = [];
			for (let key in this.allMarginData) {
				if (Number(this.allMarginData[key].CURRENT_BALANCE) != 0) {
					list.push(key);
				}
			}
			return list;
		}
	},
};
</script>
<style lang="scss" scoped>
.head {
	padding: 0 10px;
	background-color: #333;
}
.btn {
	margin: 5px 0;
	min-height: 2em;
	max-width: 40%;
	min-width: 40%;
	border: 1px solid #373737;
}
.selected {
	border: 1px solid rgb(255, 152, 0);
	color: rgb(255, 152, 0);
}
</style>
