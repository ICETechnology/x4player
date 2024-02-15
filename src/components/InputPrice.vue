<template>
    <div ref="ctn" class="input-price-ctn flex-row flex-center border-around sys-bgc clr-gray2 rd1 posr label" :class="{'pdl1em': label}">
		<label v-if="label" class="label-text font-size-nano" :style="textLabelStyle">{{label}}</label>
		<!-- 減號按鈕 -->
		<div><span class="flex-center tcef btn pd1" :class="{disabled: disable, 'order-modify': this.from == 'orderModify'}" @click="modifyPrice(-1)" v-long-press="e=>modifyPrice(-1)">
			<i class="material-icons md-18">remove</i></span></div>
		<!-- ＃小數商品 -->
		<div v-if="!propDenoObject" class="flex-1" :class="{'font-size-large': largeSize}">
			<!-- @捲動輸入器 -->
			<InputSelector v-model="displayValue" :sid="sid" :step="multTickSize" :disable="disable" v-if="scrollInput" />
			<!-- @鍵盤輸入器(cn)因為台版有特殊效果，不確定是否為PM要求，所以不做合併 -->
			<input ref="ipt" class="flex-1 input-qty rd0 bgc-2A clr-white" type="text" inputmode="decimal" v-model.lazy="displayValue"
				v-if="keybordInput&&!twMode" :step="multTickSize" :class="{disabled: disable, 'h2em': !label}" :maxlength="valueLimit"/>
			<!-- @鍵盤輸入器(tw)當移除最後一個數字會重設現價(因input事件及無設定lazy)不確定是否為需求，所以分開處理 -->
			<input ref="ipt" class="flex-1 input-qty rd0 bgc-2A clr-white" type="text" inputmode="decimal" v-model="displayValue" @blur="parseValue"
				v-if="keybordInput&&twMode" :step="multTickSize" :class="[{disabled: disable, 'h2em': !label, 'font-bold': largeSize },inputClass]" @input="displayValueLimit" :maxlength="maxlength"/>
		</div>
		<!-- ＃分數商品 -->
		<div v-if="propDenoObject" class="flex-1 flex-row mgt1">
			<div class="flex-1 flex-center">
				<!-- 整數 -->
				<input type="text" inputmode="numeric" class="input-integer" v-model="inputInteger" @input="inputIntegerLimit" />
			</div>
			<div class="flex-1 mgl1 flex-col">
				<div class="flex-1">
					<!-- 分子 -->
					<input type="text" inputmode="decimal" class="input-molecular" v-model="inputMolecular" @input="inputMolecularLimit" />
				</div>
				<!-- 分母 -->
				<div class="flex-1 flex-center">/ {{propDenoObject.deno}}</div>
			</div>
		</div>
		<!-- 加號按鈕 -->
		<div><span class="flex-center tcef btn pd1" :class="{disabled: disable, 'order-modify': this.from == 'orderModify'}" @click="modifyPrice(1)" v-long-press="e=>modifyPrice(1)">
			<i class="material-icons md-18">add</i></span></div>
    </div>
</template>

<script>
import QuoteAgent from '@/components/QuoteAgent';

export default {
	mixins: [QuoteAgent],
	props: ["value", "disable", "propSid", 'label', 'from', 'inputClass', 'maxlength', 'largeSize'],
	data() {
		return {
			// 顯示值
			displayValue: null,
			// [支持分數商品] 輸入整數
			inputInteger: null,
			// [支持分數商品] 輸入分數
			inputMolecular: null,
			// 原始的TickSize (僅一次，且未經乘數處理)
			origTickSize: null,
			// 一般價格輸入最大長度(cn)
			valueLimit: 12,
		}
	},
	mounted() {
		// 更新顯示值
		if (!isNaN(this.value))
			this.displayValue = M4C.Symbol.doMult(this.sid, this.value);
		// 支持 AUTOTEST 設值
		if (this.$store.state.autotest.enable)
			this.$refs.ctn.$vueInstance = this;
		// init 就決定 ticksize (若用 computed 會隨最新價跳動而一直重拿，太重)
		this.origTickSize = M4C.Symbol.getTickSize(this.sid, this.useablePrice);
		// [支持分數商品]
		if (this.propDenoObject) {
			this.inputInteger = this.propDenoObject.integer;
			this.inputMolecular = this.propDenoObject.molecular;
		}
	},
	beforeDestroy() {
	},
    methods: {
		// 支持 AUTOTEST 設值
		setValue(val) {
			this.nextValue = val;
			this.$emit("input", Number(val));
		},
		/** 增減委託價格 */
		modifyPrice(cnt) {
			let price  = this.value;
			// 如果價格為空字串時，以現價加總(為富邦下單後清空價格、數量需求而調整)
			if(price === '') price = this.$qoPrice
			// 重取ticksize並依增減情境調整。
			let ts = M4C.Symbol.getTickSize(this.sid, price, cnt < 0);
			this.$emit("input", +Big(price || 0).plus(Big(ts).times(cnt)));
		},
		// [支持分數商品] 輸入整數/分子有變，更新給上層input
		updateFraction() {
			let val = M4C.Symbol.denoToDecimal({integer: this.inputInteger, molecular: this.inputMolecular, deno: this.propDenoObject.deno});
			this.$emit("input", val);
		},
		// 一般小數商品輸入限制
		displayValueLimit() {
			let inputStr = `${this.displayValue}`;
			// 限制長度限制為 12 碼 (ex. 2年債 : 102.33203125)
			if (inputStr.length > 12) {
				inputStr = inputStr.substr(0,12);
				this.displayValue = Number(inputStr);
			}
		},
		parseValue(){
			// 顯示值非預期->使用市價
			if (isNaN(this.displayValue))
				this.displayValue = M4C.Symbol.doMult(this.sid, this.$qoPrice);
		},
		// 分數商品的[整數]欄位輸入限制
		inputIntegerLimit() {
			let inputStr = `${this.inputInteger}`;
			// 限制長度限制為 6 碼
			if (inputStr.length > 6) {
				inputStr = inputStr.substr(0,6);
				this.inputInteger = Number(inputStr);
			}
		},
		// 分數商品的[分子]欄位輸入限制
		inputMolecularLimit() {
			let inputStr = `${this.inputMolecular}`;
			// 限制長度限制為 6 碼
			if (inputStr.length > 6) {
				inputStr = inputStr.substr(0,6);
				this.inputMolecular = Number(inputStr);
			}
		},
	},
	watch: {
		// 實際值改變時
		value(nv, ov) {
			// 更新顯示值
			this.displayValue = M4C.Symbol.doMult(this.sid, this.value);
		},
		// 顯示值改變時
		displayValue(nv, ov) {
			// null時不處理，避免在big計算時出現exception
			if(nv == null) return;
			// 更新實際值
			if (this.displayValue != '' && !isNaN(this.displayValue))
				this.$emit("input", +Big(this.displayValue).div(this.showMult));
		},
		// [支持分數商品] 傳入值有變時，更新整數與分子
		propDenoObject() {
			this.inputInteger = this.propDenoObject.integer;
			this.inputMolecular = this.propDenoObject.molecular;
		},
		// [支持分數商品] 輸入的整數
		inputInteger() {
			this.updateFraction();
		},
		// [支持分數商品] 輸入的分子
		inputMolecular() {
			this.updateFraction();
		},
		// sid改變時重設ticksize
		sid(nv) {
			this.origTickSize = M4C.Symbol.getTickSize(nv, this.useablePrice);
		}
	},
    computed: {
		/** 支持上層傳入的 propSid，沒有時使用 selectedSymbol.ID */
		sid() {
			return this.propSid || this.$store.state.selectedSymbol.ID;
		},
		scrollInput() {return this.$store.state.config.inputType == "S";},
		keybordInput() {return this.$store.state.config.inputType == "K";},
		// [支持分數商品] 傳入價格->分數物件
		propDenoObject() {
			return M4C.Symbol.getDenoObject({sid: this.sid, val: this.displayValue});
		},
		// 乘數後TickSize
		multTickSize() {
			return M4C.Symbol.doMult(this.sid, this.origTickSize);
		},
		// 顯示乘數
		showMult() {
			return M4C.Symbol.getShowMult(this.sid) || 1;
		},
		// 可用價格 : 用來取得 TickSize 用
		useablePrice() {
			return this.qo.p || this.qo.r || this.qo.bp1 || this.qo.sp1;
		},
		twMode() {return this.$store.state.config.twMode;},
		// 文字标签样式微调
		textLabelStyle() {
			if (this.label.length === 4)
				return "left: 0";
		},
	},
}
</script>

<style scoped>
input {
	-webkit-appearance: none;
}
.input-qty {
	/* 填滿 parent */
	/* display:table-cell; */
	width: 100%;
	text-align: center;
	height: 9vw;
	padding: 0;
	border: 0;
	/* border-radius: 6px; */
}
.input-integer {
	width: 100%;
	text-align: center;
	height: 2em;
	padding: 0;
	border: 0;
	color: white;
	background-color: #2A2A2A;
}
.input-molecular {
	width: 100%;
	text-align: center;
	height: 2em;
	padding: 0;
	border: 0;
	color: white;
	background-color: #2A2A2A;
}
.h2em {
	height: 2em;
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
.clr-pink{
	color: rgb(255, 142, 137) !important;
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