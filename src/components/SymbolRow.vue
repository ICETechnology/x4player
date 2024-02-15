<template>
	<div class="symbol-row-ctn flex-row pdtb3">
		<div class="flex-1 flex-col">
			<!-- 合約名稱 -->
			<div class="flex-1 flex-start font-size-large font-bold">
				<div class="name" @click="onNameClick">{{$store.state.selectedSymbol.Name}}</div>
				<div class="posr">
					<FavoriteIcon ref="fav" class="fav-ctn" :symbol="sid"></FavoriteIcon>
				</div>
			</div>
			<!-- 代碼月份 -->
			<div class="flex-1 clr-gray font-bold flex-row flex-start">
				<div class="pdr1">{{$store.state.selectedSymbol.CIDM4}}</div>
				<PositionMicro :sid="sid"></PositionMicro>
				<!-- 持倉損益 -->
				<span :class="{'cell-PL':ssps.UNREALIZED_PL}" v-if="posPL && Object.keys(ssps).length">{{$displayPL(ssps.UNREALIZED_PL)}}</span>
			</div>
		</div>
		<div class="flex-center">
			<span v-if="!simpleMode" class="flex-center cbtn tcef" :class="{selected: value==='chart'}"
				@click="onBtnSwitch('chart')">{{$ln(`图`)}}</span>
			<span v-if="!simpleMode" class="flex-center cbtn tcef" :class="{selected: value==='fast'}"
				@click="onBtnSwitch('fast')">{{$ln(`快`)}}</span>
			<span v-if="!simpleMode" class="flex-center cbtn tcef" :class="{selected: value==='thunder'}"
				@click="onBtnSwitch('thunder')">{{$ln(`闪`)}}</span>
			<span v-if="!simpleMode" class="flex-center cbtn tcef" :class="{selected: value==='info'}"
				@click="onBtnSwitch('info')"><i class="material-icons">priority_high</i>
			</span>
		</div>
	</div>
</template>
<script>
import MixHeadSymbolposThunder from "@/components/Mix/mix.head.symbolPos.thunder.vue";

export default {
	props: ["value", 'simpleMode', 'posPL'],
	data(){
		return{
		}
	},
	computed: {
		$displayPL() {return this.$store.state.fn.$displayPL;},
		sid() {return this.$store.state.selectedSymbol.ID;},
		ssps() {
			return this.$store.state.selectedSymbol.positionSum;
		},
	},
	methods: {
		/** 點名稱也連動最愛星星 */
		onNameClick() {
			if (this.$refs.fav && this.$refs.fav.open)
				this.$refs.fav.open();
		},
		/** 彈出快速下單 */
		onBtnSwitch(val) {
			this.$emit("input", val);
		},
	},
	components: {
		MixHeadSymbolposThunder,
	}
}
</script>
<style scoped>
.symbol-row-ctn {
	padding: 2vw 1vw 0 1vw;
}
.name {
	white-space: nowrap;
	display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
}
.cbtn {
	margin: 0.5vw;
	width: 10vw;
	height: 10vw;
	border-radius: 5vw;
	color: black;
	background: #EEE;
}
.cbtn.selected {
	color: white;
	background-color: #518FF5;
}
.fav-ctn {
	position: absolute;
	top: -5.5vw;
	left: 0;
}
.cell-PL{
	background-color:black;
	padding: 1px 6px;
	border-radius: 10px;
}
</style>
