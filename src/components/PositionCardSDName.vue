<template>
	<div class="position-card-sdname-ctn flex-start font-size-small flex-col flex-1">
		<div class="w100p flex-row flex-start">
			<span class="mglr1">{{symbolName}}</span>
			<span class="mgr1" v-if="month">{{month}}{{$ln('月')}}</span>
			<span v-if="isOption(sid)" class="flex-center">{{StrikePrice}}</span>
			<div class="font-size-mini clr-orange mgr1">{{setPRIADJ1}}</div>
			<span v-if="isOption(sid)" class="cp-icon flex-center rd1 clr-gray2">{{$ln(CPText)}}</span>
		</div>
		<div class="w100p flex-row flex-start mgt1" v-if="sid2 || isPriceDiffFut">
			<span class="mglr1">{{symbolName2}}</span>
			<span class="mgr1" v-if="month2">{{month2}}{{$ln('月')}}</span>
			<span v-if="sid2 && isOption(sid2)" class="flex-center">{{StrikePrice2}}</span>
			<div class="font-size-mini clr-orange mgr1">{{setPRIADJ1}}</div>
			<span v-if="sid2 && isOption(sid2)" class="cp-icon flex-center rd1 clr-gray2">{{$ln(CPText2)}}</span>
		</div>
	</div>
</template>

<script>
export default {
	props: ['sid', 'sid2'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		isOption(sid) {
			return M4C.Option.isOpt(sid);
		},
		getMonth(sid) {
			if (!sid) return;
			let sids = sid.split('.');
			if (sids[4]==='HOT')
				sid = M4C.Symbol.toMonthSymbol(sid);
			let mth = sid.split('.')[4];
			mth = mth ? Number(mth.substr(2).split('').slice(-2).join('')) : '';
			return mth;
		},
	},
	watch: {},
    computed: {
		// "澳幣"
		symbolName() {
			return M4C.Symbol.getContractName(this.sid);
		},
		symbolName2() {
			if(this.isPriceDiffFut)
				return this.symbolName;
			else
				return M4C.Symbol.getContractName(this.sid2);
		},
		// 月份
		month(){
			return this.getMonth(this.sid);
		},
		month2(){
			if(this.isPriceDiffFut)
				return Number(this.sid.split('.').slice(-1)[0].slice(-2));
			else
				return this.getMonth(this.sid2);
		},
		// 履約價
		StrikePrice() {
			return M4C.Option.getStrike(this.sid);
		},
		StrikePrice2() {
			return M4C.Option.getStrike(this.sid2);
		},
		// 依CP顯示文字
		CPText() {
			return M4C.Option.getCallPut(this.sid) === 'C' ? '购': '沽';
		},
		CPText2() {
			return M4C.Option.getCallPut(this.sid2) === 'C' ? '购': '沽';
		},
		// 除權息合約
		setPRIADJ1() {
			let minfo = M4C.Symbol.getMainformInfo(this.sid);
			return minfo ? (minfo.SetPRIADJ || '') : '';
		},
		setPRIADJ2() {
			let minfo = M4C.Symbol.getMainformInfo(this.sid2);
			return minfo ? (minfo.SetPRIADJ || '') : '';
		},
		// 是否為價差期貨
		isPriceDiffFut() {
			return M4C.Symbol.isPriceDiff_FutSymbol(this.sid);
		},
	},
}
</script>

<style scoped>
.dayline-ctn,.cp-icon{
	border: 1px solid #666;
}
.cp-icon{
	width: 1.2em;
	height: 1.2em;
}
</style>