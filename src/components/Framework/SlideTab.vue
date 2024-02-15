<template>
	<div id="slide-ctn" ref="slideCtn" class="slide-tab-ctn flex-row">
		<span v-for="(item, index) in tabList"
			:key="index"
			:class="['tab flex-center ' + (selectedIndex==index ? 'selected' : '')]"
			@click="onTabClick(index)">{{$ln(item.label)}}</span>
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
		onTabClick(idx) {
			this.selectedIndex = idx;
			this.emitSymbolChanged();
		},
		moveSelectTab(cnt) {
			this.selectedIndex += cnt;
			this.selectedIndex = this.selectedIndex < 0 ? 0 : this.selectedIndex < (this.tabList.length - 1)? this.selectedIndex: this.tabList.length - 1;
			this.emitSymbolChanged();
			let ctn = this.$refs.slideCtn;
			if (this.cancelScroll)
				this.cancelScroll();
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
		emitSymbolChanged() {
			let idx = this.selectedIndex;
			let tab = this.tabList[idx];
			if (tab) {
				this.$emit('symbolChanged', tab.label, tab.param);
			}
		},
	},
	beforeMount: function() {
	},	
	mounted() {
		this.emitSymbolChanged();
	},
	watch: {
		tabList: function(nv, ov) {
			// 切到最新被 selected 的類別
			let selectedIdx = 0;
			nv.forEach((item, idx)=>{
				if (item.selected)
					selectedIdx = idx;
			});
			this.onTabClick(selectedIdx);
		}
	}
}
</script>

<style>
.slide-tab-ctn {
	white-space: nowrap;
	background-color: black;
	overflow-x: scroll; /* has to be scroll, not auto */
	
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