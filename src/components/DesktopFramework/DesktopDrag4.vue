<template>
    <div class="desktop-drag4 FULL" v-if="dragCom">
		<div class="btn tp" @dragover.prevent="coverSide = 'tp'" @dragleave.prevent="coverSide = ''" @drop="onDrop('flex-col', 'tp')"></div>
		<div class="btn lp" @dragover.prevent="coverSide = 'lp'" @dragleave.prevent="coverSide = ''" @drop="onDrop('flex-row', 'lp')"></div>
		<div class="btn bp" @dragover.prevent="coverSide = 'bp'" @dragleave.prevent="coverSide = ''" @drop="onDrop('flex-col', 'bp')"></div>
		<div class="btn rp" @dragover.prevent="coverSide = 'rp'" @dragleave.prevent="coverSide = ''" @drop="onDrop('flex-row', 'rp')"></div>
		<div v-if="coverSide" class="FULL cover" :class="[coverSide]"></div>
    </div>
</template>

<script>
export default {
	props: [],
	data() {
		return {
			coverSide: '',
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onDrop(flex, side) {
			this.coverSide = '';
			// 來源頁簽所屬容器應移除該頁簽
			if (this.dragCtn) {
				this.dragCtn.removeCom(this.dragCom);
			}
			// 深拷貝拖曳元件設定
			let obj = JSON.parse(JSON.stringify(this.dragCom));
			obj.UCID = obj.UCID || "".random(16);
			obj.selected = true;
			// 等來源 Container 刪除完成(可能有層數搬移) 後，再開始做當前的層數搬移
			setTimeout(()=>{
				// 將原本的 layoutBody 下降一層
				if (side === 'tp' || side === 'lp') {
					this.$store.state.desktop.selectedLayout.layoutBody = {
						flex: flex,
						c2wh: "70%",
						com1: {coms: [obj]},
						com2: this.$store.state.desktop.selectedLayout.layoutBody,
					};
				}
				else {
					this.$store.state.desktop.selectedLayout.layoutBody = {
						flex: flex,
						c2wh: "30%",
						com1: this.$store.state.desktop.selectedLayout.layoutBody,
						com2: {coms: [obj]},
					};
				}
				// 清除拖曳情境
				this.$store.state.desktop.dragCom = null;
				this.$store.state.desktop.dragCtn = null;
			}, 100);
		},		
	},
	watch: {},
    computed: {
		dragCom() {
			return this.$store.state.desktop.dragCom;
		},
		dragCtn() {
			return this.$store.state.desktop.dragCtn;
		},
	},
}
</script>

<style scoped>
/* 四向按鈕 */
.btn {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9;
}
.btn.tp {
	height: 30px;
	bottom: auto;
}
.btn.lp {
	width: 30px;
	right: auto;
}
.btn.bp {
	height: 30px;
	top: auto;
}
.btn.rp {
	width: 30px;
	left: auto;
}
/** 預期佔用區塊 */
.cover {
	z-index: 8;
	opacity: 0.5;
	background: #999;
	border: 1px dashed white;
}
.cover.tp {
	bottom: auto;
	height: 30%;
}
.cover.bp {
	top: auto;
	height: 30%;
}
.cover.lp {
	right: auto;
	width: 30%;
}
.cover.rp {
	left: auto;
	width: 30%;
}
</style>