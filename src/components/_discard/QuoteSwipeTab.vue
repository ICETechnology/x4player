<template>
	<div id="slide-ctn" ref="slideCtn" class="slide-tab-ctn flex-row">
		<span v-for="(item, index) in tabList"
			:key="index"
			:class="['tab flex-center ' + (selectedIndex==index ? 'selected' : '')]"
			@click="onTabClick(index)">{{item.label}}</span>
	</div>
</template>

<script>
export default {
	props: ['tabList'],
	data() {
		return {
			selectedIndex: 0,
			widthPlus: 3,	// 頁簽寬度微調 (會因 margin 多寡而調整)
		}
	},
	components: {
	},
	computed: {
	},
	methods: {
		// 由本身點擊tab
		onTabClick(idx) {
			this.selectedIndex = idx;
			this.emitTabIndexChanged();
		},
		// 由外部呼叫改變選取tab
		moveSelectTab(idx) {
			this.selectedIndex = idx;
			// 支持滑動途中取消
			if (this.cancelScroll)
				this.cancelScroll();
			// 動態捲動至當前已選定的tab
			this.scrolling();
		},
		// 動態捲動至當前已選定的tab
		scrolling() {
			let ctn = this.$refs.slideCtn;
			setTimeout(()=>{
				let tab = ctn.querySelector('.selected');
				if (tab) {
					// scrolling 效果
					var VueScrollTo = require('vue-scrollto');
					var options = {
						container: '#slide-ctn',
						easing: 'ease-in',
						offset: -ctn.clientWidth/2 + tab.clientWidth/2,
						force: true,
						cancelable: true,
						x: true,
						y: false
					}
					this.cancelScroll = VueScrollTo.scrollTo(tab, 250, options);
				}
			}, 10);
		},
		emitTabIndexChanged() {
			let idx = this.selectedIndex;
			let tab = this.tabList[idx];
			if (tab) {
				this.$emit('tabIndexChanged', idx);
			}
		},
	},
	beforeMount: function() {

	},	
	mounted() {
		// this.emitTabIndexChanged();
	},	
}
</script>

<style>
.slide-tab-ctn {
	white-space: nowrap;
	background-color: black;
	overflow-x: scroll; /* has to be scroll, not auto */
	-webkit-overflow-scrolling: touch;
}
.slide-tab-ctn::-webkit-scrollbar {
	display: none;
}
.slide-tab-ctn .tab {
	margin: 0 .5em;
	min-width: 4.2em;
	width: auto;
	border-bottom: 1px solid #323232;
    white-space: normal;
    text-align: center;
}
.slide-tab-ctn .tab.selected {
	border-bottom: 2px solid #FF9800;
}
</style>