<template>
	<div class="jstest-ctn flex-center">
		<span class="tcef device-id-label" :class="{'background-animate': running}">{{deviceID}}</span>
	</div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			// 執行中
			running: false,
			// JSTest-DeviceID (不使用系統的 deviceID 避免與遊客帳號綁定)			
			deviceID: '',
		}
	},
	beforeMount() {
		this.$store.state.components.jstest = window.jstest = this;
		// 載入 JSTest 核心程式
		appendScript(window.urlParam.corePath || `http://ss2-dev.icetech.com.tw/jstest/dist/core2.js`);
    },
}
</script>

<style scoped>
.jstest-ctn {
	position: absolute;
	width: 32px;
	height: 32px;
	left: calc(50% - 16px);
	bottom: 35px;
	z-index: 99999;
}
.device-id-label {
	padding: 1vw 2vw;
	border-radius: 4px;
	color: black;
	font-weight: 800;
	background-color: orange;
}
</style>