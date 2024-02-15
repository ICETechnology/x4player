<template>
	<div class="scroll-input-ctn flex-center" :class="{'flex-row': !mode, 'flex-col col-reverse': mode == 1}">
		<div><span class="flex-center cbtn tcef" :class="{disabled: false}" @click="modifyQty(-step)" v-if="!noBtn"><i class="material-icons">remove</i></span></div>
		<div v-stop-propagation class="flex-1 flex-center">
			<input ref="scroll_ipt" class="w100p" type="range" :min="minValue" :max="maxValue" :step="minStep" v-model="nextValue">
		</div>
		<div><span class="flex-center cbtn tcef" :class="{disabled: false}" @click="modifyQty(step)" v-if="!noBtn"><i class="material-icons">add</i></span></div>
		<InputSelector v-model="nextValue" :step="minStep" :min="min" :max="max" />
	</div>
</template>
<script>
export default {
	data(){
		return{
			minValue: isNaN(this.min) ? 1 : this.min,
			maxValue: isNaN(this.max) ? Number.MAX_VALUE : this.max,
			minStep: isNaN(this.step) ? 1 : this.step,
			nextValue: this.value,
		}
	},
	props:["value", "max", "min", "step", "mode", "noBtn"],
	mounted() {
		this.$refs.scroll_ipt.style["background-image"] = this.getGradientStyle(this.value);
	},
	methods: {
		modifyQty(step){
			this.nextValue = Number(Big(this.nextValue).plus(step));
		},
		getGradientStyle(v){
			let pos = Math.ceil(Big(v).div(this.maxValue).times(100));
			return `-webkit-linear-gradient(left, rgb(222, 120, 28) 0%, rgb(222, 120, 28) ${pos}%, rgb(255, 255, 255) ${pos}%, rgb(255, 255, 255) 100%)`;
		}
	},
	computed: {},
	watch: {
		nextValue(nv, ov){			
			this.$refs.scroll_ipt.style["background-image"] = this.getGradientStyle(nv);
			this.$emit('input', Number(nv));
		},
		value(nv, ov) {
			this.nextValue = nv;
		},
		max(nv, ov) {
			this.maxValue = nv;
			this.$refs.scroll_ipt.style["background-image"] = this.getGradientStyle(this.value);
		},
		min(nv, ov) {
			this.minValue = nv;
		},
		step(nv, ov) {
			this.minStep = nv;
		}
	}
}
</script>
<style scoped>
input[type=range]{
	-webkit-appearance: none;
	border-radius: 5px;
	margin:0;
}

input[type=range]::-webkit-slider-runnable-track {
    /* width: 100%; */
    height: 5px;
    border: none;
}

input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    border: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: rgb(222, 120, 28);
    margin-top: -6px;
}

input[type=range]:focus {
    outline: none;
}
.cbtn {
	margin: 2px;
}
/* 戰鬥閃電的跳價垂直捲軸ui */
.fight-config .scroll-input-ctn input[type=range] {
    height: 20vw;  
    width: 10vw;
    -webkit-appearance: slider-vertical;
}
.fight-config .scroll-input-ctn /deep/ .input-ctn {
	background: none;
	color: white;
}
@media screen and (orientation: landscape) {
	.cbtn{
		margin: 2px;
		border-radius: 5vh;
		width: 10vh;
		height: 10vh;
		color: black;
		background: #EEE;
	}
}
/** 桌機版 */
.desktop .input[type=range]::-webkit-slider-thumb {
	height: 1em;
    width: 1em;
}
.desktop .cbtn {
	width: 2em;
	height: 2em;
}
</style>