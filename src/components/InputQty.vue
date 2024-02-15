<template>
    <div ref="ctn" class="input-qty-ctn flex-row flex-center sys-bgc clr-gray2 rd1 posr label" :class="{'is-disabled': disable, 'pdl1em': label, 'border-around': !btnStyle}">
		<label v-if="label" class="label-text font-size-nano">{{label}}</label>
		<div class="flex-center tcef pd1" :class="{'order-modify': this.from == 'orderModify'}" @click="modifyQty(-1)" v-long-press="e=>modifyQty(-1)" v-if="!noBtn">
			<i class="material-icons md-18" :class="{'clr-white': btnStyle}">{{btnStyle? btnStyle.remove: 'remove'}}</i></div>
		<div class="flex-1" :class="{'font-size-large':largeSize}" >
			<InputSelector v-model="nextValue" :step="qtykStep" :min="minValue" :max="maxValue" :disable="disable" v-if="scrollInput" />
			<input class="flex-1 input-qty" type="text" inputmode="numeric" v-model="nextValue" @blur="parseValue" @input="nextValueLimit"
				v-if="keybordInput"  :class="{'h2em': !label, 'rd0 bgc-2A clr-white': !btnStyle, 'rd1 pd1': btnStyle , 'font-bold': largeSize}" />
		</div>
		<div class="flex-center tcef pd1" :class="{'order-modify': this.from == 'orderModify'}" @click="modifyQty(1)" v-long-press="e=>modifyQty(1)" v-if="!noBtn">
			<i class="material-icons md-18" :class="{'clr-white': btnStyle}">{{btnStyle? btnStyle.add: 'add'}}</i></div>
	</div>
</template>

<script>
export default {
	props: ["value", "disable", "min", "max", "noBtn", "step", 'label', 'btnStyle', 'symbol', 'from', 'largeSize'],
	data() {
		return {
			// minValue: isNaN(this.min) ? 1 : Number(this.min),
			// maxValue: isNaN(this.max) ? Number.MAX_VALUE : Number(this.max),
			// 不能用 value 再往下層送，因此用此變數中介 (會出現 warning)
			nextValue: this.value,
		}
	},
	beforeMount() {
		// init 就決定 ticksize (如果隨跳動取 ticksize 太重)
		this.tickSize = M4C.Symbol.getTickSize(this.sid, this.qo.p);
	},
	mounted() {
		// 支持 AUTOTEST 設值
		if (this.$store.state.autotest.enable)
			this.$refs.ctn.$vueInstance = this;
	},
	beforeDestroy() {},
    methods: {
		// 支持 AUTOTEST 設值
		setValue(val) {
			this.nextValue = val;
			this.$emit("input", Number(val));
		},
		/** 增減手數 */
		modifyQty(cnt) {
			let newValue = Number(this.value) + (cnt * this.qtykStep);
			newValue = newValue > this.minValue ? newValue : this.minValue;
			newValue = newValue <= this.maxValue ? newValue : this.maxValue;
			this.$emit("input", Number(newValue));
		},
		parseValue(){
			let v =  this.nextValue;
			// 無數字時以最低值顯示。
			if(v===""){
				this.nextValue = this.minValue; 
				this.$emit("input", Number(this.minValue)); 
				return;
			}
			let regexp = new RegExp(/[^0-9]/);
			// 輸入非數字或組成非數字則恢復輸入前的資料。
			let inputKey = v.toString().slice(-1);
			if(regexp.test(inputKey) || isNaN(v)){
				let value = v.toString().slice(0, v.length - 1);
				this.nextValue = this.value;
			}
			// 超過最大值以最大值顯示。
			else if(Number(v) > this.maxValue){
				this.nextValue = this.maxValue;
				this.$emit("input", Number(this.maxValue));
			}
			// 正常值不處理。
			else this.$emit("input", Number(v));;
		},
		// 數量輸入限制
		nextValueLimit() {
			let inputStr = `${this.nextValue}`;
			// 限制長度限制為 6 碼
			if (inputStr.length > 6) {
				inputStr = inputStr.substr(0,6);
				this.nextValue = Number(inputStr);
			}
		},
	},
	watch: {
		value() {
			this.nextValue = this.value;
		},
		// InputSelector 選擇器點選改變資料時
		nextValue(nv, ov) {
			if(nv != ov && ov)
				eventBus.$emit("IPTCHANGE");
			if(this.scrollInput)
				// 處理新值
				this.parseValue(nv);
		},
	},
    computed: {
		isStock() {return this.sid.split(".")[1] === "S"},
		// stock最低單位
		qtykStep() {
			// 有props參數用props參數。
			if(this.step) return this.step;
			// 沒有就依據sid判斷是否為證券給step值。
			return this.isStock? this.$store.state.order.stkQtyStep: 1},
		qo() {return this.$store.state.selectedSymbol.QO;},
		sid() {return this.symbol || this.$store.state.selectedSymbol.ID;},
		maxValue() {return isNaN(this.max) ? Number.MAX_VALUE : Number(this.max);},
		minValue() {return isNaN(this.min) ? this.isStock? this.qtykStep : 1 : Number(this.min);},
		scrollInput() {return this.$store.state.config.inputType == "S";},
		keybordInput() {return this.$store.state.config.inputType == "K";},
	},
}
</script>

<style scoped>
input {
	/* 填滿 parent */
	display:table-cell;
	width: 100%;
	text-align: center;
	height: 9vw;
	padding: 0;
	border: 0;
	/* border-radius: 6px; */
}
/* 停用效果 */
.input-qty-ctn.is-disabled {
	pointer-events: none;
}
.input-qty-ctn.is-disabled input {
	color: #363C42 !important;
	background-color: #17202A !important;
}

.h2em {
	height: 2em;
}
.ts-jump-qty .h2em{
	height: 9vw;
}
.border-around {
	border: 1px solid #393939;
}
.rd0 {
	border-radius: 0 !important;
}
.bgc-2A {
	background-color: #2A2A2A;
}
.pdl1em {
	padding-left: 1em;
}
.label .btn.disabled {
	background-color: rgba(0,0,0,0) !important;
}
.label-text {
	position:absolute;
	pointer-events: all;
	top: 0.1em;
	left: 0.5em;
}
input.disabled {
	background-color: rgba(0,0,0,0) !important;
}
.desktop .ts-jump-qty .h2em{
	height: 2.28em;
}
.order-modify {
    width: 30px;
}

@media screen and (orientation: landscape) {
	input {
		display:table-cell;
		width: 100%;
		text-align: center;
		height: 10vh;
		padding: 0;
		border: 0;
		/* border-radius: 6px; */
	}

	/** 桌機版 (已經過校正) */
	.desktop input {
		height: 2.28em;
	}
}
</style>