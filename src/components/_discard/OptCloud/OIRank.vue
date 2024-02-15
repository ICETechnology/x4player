<template>
    <div class="ivrank-ctn flex-col">
		<!-- 表頭列 -->
		<MyHead v-if="isPortrait" class="head" :backType="1" :showText="$ln('持仓量观测')"></MyHead>
		<!-- 选择权下拉选单 -->
    	<div class="flex-row pd1 list-block">
			<!-- 下拉選單 -->
			<OptionSelector class="flex-1 mg1" v-model="contracts"/>
		</div>
		<!-- Put-Call Ratio 区域 -->
		<div class="put-call-ratio-ctn flex-col">
			<div class="flex-center pd2">Put-Call Ratio (%)</div>
			<div class="flex-1 canvas-ctn posr" v-stop-propagation>
				<PCChart/>
			</div>
		</div>
		<!-- 表格区 -->
		<div class="flex-1 posr">
			<div class="FULL scrolling-y" v-stop-propagation-y>
				<div class="table-ctn flex-col pdlr2 mgt3" v-for="(tableData,idx) in symbolMonthData">
					<div class="flex-center mg1">{{formatMonth("202002")}} {{formatHeadText(idx)}}</div>
					<div class="flex-1">
						<div class="flex-row line clr-gray">
							<div class="flex-1 flex-center">{{$ln(`数量(万)`)}}</div>
							<div class="flex-1 flex-center">{{$ln(`看涨期权`)}}</div>
							<div class="flex-1 flex-center">{{$ln(`日期`)}}</div>
							<div class="flex-1 flex-center">{{$ln(`看跌期权`)}}</div>
							<div class="flex-1 flex-center">{{$ln(`数量(万)`)}}</div>
						</div>
						<div class="flex-row line" v-for="(obj, key, idx) in tableData">
							<div class="flex-1 flex-center">{{obj[0] ? formatVolume(obj[0].oi) : '-'}}</div>
							<div class="flex-1 flex-center">{{obj[0] ? obj[0].ep : '-'}}</div>
							<div class="flex-1 flex-center bgc-333">{{key ? formatDate(key) : '-'}}</div>
							<div class="flex-1 flex-center">{{obj[1] ? obj[1].ep : '-'}}</div>
							<div class="flex-1 flex-center">{{obj[1] ? formatVolume(obj[1].oi) : '-'}}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
    </div>
</template>

<script>
import OptionSelector from "@/components/OptionSelector.vue";
import PCChart from "@/components/OptCloud/OIRank.PCChart.vue";
export default {
	props: [],
	data() {
		return {
			/** 下拉選單決定當前的 contracts */
			contracts: {},

			symbolMonthData: [
				{
					"20200313": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
					"20200312": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
					"20200311": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
					"20200310": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
				},
				{
					"20200313": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
					"20200312": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
					"20200311": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
					"20200310": [{"cp": "C", "ep": 3.4, "oi": 11554, "s": "I.O.SSE.510050.202009.C.3.4"}, {"cp": "P", "ep": 2.8, "oi": 6806, "s": "I.O.SSE.510050.202009.P.2.8"}],
				}
			],

			oiData: {},
		}
	},
	beforeMount() {
		// 註冊資料分派
		M4C.regDispatch({
			's': 'OptCloud',
			'c': 'getOIRank',
			'callback': this.onData.bind(this)
		});
	},
    mounted() {},
	beforeDestroy() {},
	components: {
		OptionSelector,
		PCChart,
	},
    methods: {
		formatHeadText(idx) {
			if (idx === 0)
				return this.$ln(`最大持仓合约`);
			else if (idx === 1)
				return this.$ln(`次大持仓合约`);
			else
				return this.$ln(`第 ${idx+1} 大持仓合约`);
		},
		formatMonth(val) {
			return val.length === 6 ? `${val.substr(0,4)} / ${val.substr(4,2)}` : val;
		},
		formatVolume(val) {
			return (val / 10000).toFixed(1);
		},
		formatDate(val) {
			return `${parseInt(val.substr(4,2))}/${val.substr(6,2)}`;
		},
		onData(data) {
			if (data.cd === 0) {
				// this.symbolMonthData = data.d.data[0].data;
			}
			if (data.lt === true) {

			}
		}
	},
	watch: {
		contracts(nv) {
			let tmp = nv.C[0].split('.');
			let exg = tmp[2];
			let sym = tmp[3];
			let mon = tmp[4];
			let cmd = {
				"s": "OptCloud",
				"c": "getOIRank",
				"d": {
					"exchange": exg,
					"commodity": sym,
				},
				"r": "".random()
			};
			M4C.send(cmd);				
		}
	},
    computed: {
		// 響應式轉向變數 (直向=true)
		isPortrait() {
			return this.$store.state.status.isPortrait;
		},
		/** 系統語系 */
		langKey() {
			return this.$store.state.lang.mainformLangKey;
		}
	},
}
</script>

<style scoped>
.canvas-ctn {
	height: 150px;
	min-height: 150px;
}
.line {
	height: 10vw;
	border-bottom: 1px solid #666;
}
</style>