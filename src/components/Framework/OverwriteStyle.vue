<template>
	<div class="overwrite-style hidden"></div>
</template>

<script>
export default {
	props: [],
	data() {
		return {}
	},
	beforeMount() {
		let str = '';
		let color = this.$store.state.config.quotePdSetting.function.color;
		if (!color) return;
		// 全系統背景色
		if (color.sys_bgc)
			str += `.sys-bgc {background-color: ${color.sys_bgc};}`;
		// 全系統字色
		if (color.sys_txt)
			str += `.app-ctn {color: ${color.sys_txt};}`;
		// 全系統灰字色
		if (color.sys_txt_gray)
			str += `.clr-gray {color: ${color.sys_txt_gray} !important;}`;
		// 全系統灰字色
		if (color.sys_txt_gray2)
			str += `.clr-gray2 {color: ${color.sys_txt_gray2} !important;}`;
		// Input Border
		if (color.input_border)
			str += `input, .toggle-ctn, .single-select-ctn, .css-radio-btn {border: 1px solid ${color.input_border} !important;}`;
		// 表頭列背景色
		if (color.theme)
			str += `.mix-head-ctn, .quote-market-content-list .price-ctn, .expand-ctn {background-color: ${color.theme} !important;}`;
		// 展開區背景色
		if (color.expand_bgc)
			str += `.expand-ctn {background-color: ${color.expand_bgc} !important;}`;
		// 小彈窗字色
		if (color.model_txt)
			str += `.single-select-dialog, .confirm-dialog {color: ${color.model_txt} !important;}`;
		// 點擊時背景色
		if (color.touching_bgc)
			str += `.touching {background-color: ${color.touching_bgc} !important;}`;
		// 標題列背景色
		if (color.head_bgc)
			str += `.bgc-head, .extra-menu-ctn, .mix-chart-ctn .head, .thunder-table .thead {background-color: ${color.head_bgc} !important;}`;
		// 頁簽列背景色
		if (color.tab_bgc)
			str += `.tab-group-ctn > .head {background-color: ${color.tab_bgc} !important;}`;
		// 版面列背景色
		if (color.foot_bgc)
			str += `.main-ctn .foot, .bgc-foot {background-color: ${color.foot_bgc} !important;}`;
		// 版面列選擇字色
		if (color.foot_txt_selected)
			str += `.bottom-bar .btn.selected {color: ${color.foot_txt_selected} !important;}`;
		// 行情按鈕背景色
		if (color.quote_btn_bgc)
			str += `.quote-market-content-list .btn {border: 0 !important; background: ${color.quote_btn_bgc} !important;}`;
		// 期權多空背景色
		if (color.opt_callput_bgc)
			str += `.option-table-ctn .bgc-opt-gray {background-color: ${color.opt_callput_bgc} !important;}`;
		// 期權表頭背景色
		if (color.opt_head_bgc)
			str += `.option-table-ctn .opt_head_bgc {background-color: ${color.opt_head_bgc} !important;}`;
		// 期權表頭背景色
		if (color.opt_closed_strike_txt)
			str += `.option-table-ctn .closed-strike, .option-table-ctn .closed-strike-next {color: ${color.opt_closed_strike_txt} !important;}`;
		// 閃電單數列背景色
		if (color.thunder_bgc1)
			str += `.thunder-body tr {background-color: ${color.thunder_bgc1} !important;}`;
		// 閃電偶數列背景色 / 展開區偶數列背景色
		if (color.thunder_bgc2)
			str += `.thunder-body tr:nth-child(even), .expand-ctn > div:nth-child(even) {background-color: ${color.thunder_bgc2} !important;}`;
		// 按鈕 - outline
		if (color.btn_outline)
			str += `.button-ctn.outline {color: ${color.btn_outline} !important; border: 2px solid ${color.btn_outline} !important;}`;
		// 按鈕 - outline.selected
		if (color.btn_outline_selected)
			str += `.button-ctn.outline.selected {color: ${color.btn_outline_selected} !important; border: 2px solid ${color.btn_outline_selected} !important;}`;
	
		let styleSheet = document.createElement('style');
		styleSheet.innerText = str;
		document.head.appendChild(styleSheet);	        
	},
	mounted() {},
	beforeDestroy() {},
	components: {},
	methods: {},
	watch: {},
	computed: {},
}
</script>

<style scoped>
</style>