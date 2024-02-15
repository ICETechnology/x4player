<template>
    <div ref="ctn" class="desktop-container FULL">
		<!-- 可拖放區域 -->
		<DesktopContainerDropper v-if="dragCom" class="FULL" @onDrop="onDrop" />
		<!-- 1.元件情境 -->
		<DesktopTabGroup v-if="!flex && coms && coms.length>0" :coms="coms" :hideTab="param.hideTab" @hideTab="onHideTab" @onDrop="onDrop"/>
		<!-- 2.分割情境 -->
		<DesktopSplitter v-if="flex" :param="param" :key="uid" />
    </div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {
			uid: ''.random(),
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onDrop(flex, side) {
			let param = this.param;			
			// 來源頁簽所屬容器應移除該頁簽
			if (this.dragCtn) {
				this.dragCtn.removeCom(this.dragCom);
			}
			
			// deep clone
			let obj = JSON.parse(JSON.stringify(this.dragCom));
			obj.UCID = obj.UCID || "".random(16);
			obj.selected = true;
			if (side === 'center') {
				if (!this.param.coms)
					this.$set(this.param, 'coms', []);
				let coms = this.param.coms;
				coms.forEach(o=>o.selected = false);
				coms.push(obj);
			}
			else if (side === 'top' || side === 'left') {
				let orgParam = Object.assign({}, param);
				this.$set(param, 'flex', flex);
				this.$set(param, 'com1', {coms: [obj]});
				this.$set(param, 'com2', orgParam);
				this.$set(param, 'c2wh', '70%');
				delete param.coms;
			}
			else if (side === 'right' || side === 'bottom') {
				let orgParam = Object.assign({}, param);				
				this.$set(param, 'flex', flex);
				this.$set(param, 'com1', orgParam);
				this.$set(param, 'com2', {coms: [obj]});
				this.$set(param, 'c2wh', '30%');
				delete param.coms;
			}

			this.$store.state.desktop.dragCom = null;
			this.$store.state.desktop.dragCtn = null;
		},
		/** 移除指定元件obj */
		removeCom(obj) {
			if (Array.isArray(this.param.coms)) {
				let idx = this.param.coms.findIndex(o=>o===this.dragCom);
				this.param.coms.splice(idx, 1);
				// 移除後要恢復一個頁簽為 selected 狀態 (先簡單做，選第一個)
				if (this.param.coms.length)
					this.param.coms[0].selected = true;
				return idx;
			}
		},
		/** 將子分割層提升至當前本層 */
		upgradeChild(param) {
			// 將本層內容清空 (暫時替換為 null 以保持響應式)
			for (let key in this.param) {
				this.$set(this.param, key, null);
			}
			// 將子分割層內容複製回本層 (因本層是 prop 來的，不可用 this.param = param)
			for (let key in param) {
				this.$set(this.param, key, param[key]);
			}
			// 將本層 null 的屬性清掉
			for (let key in this.param) {
				if (this.param[key] == null)
					delete this.param[key];
			}
		},
		/** 隱藏此分割區的頁簽 */
		onHideTab() {
			this.$set(this.param, 'hideTab', !this.param.hideTab);
		},
	},
	watch: {
		// param: {deep: true, handler(nv) {console.log(`DesktopContainer.param : ` + JSON.stringify(nv, null, '\t'));}},
		'com1.coms.length'(nv) {
			if (nv===0)
				this.upgradeChild(this.com2);
		},
		'com2.coms.length'(nv) {
			if (nv===0)
				this.upgradeChild(this.com1);
		},
	},
    computed: {
		dragCom() {
			return this.$store.state.desktop.dragCom;
		},
		dragCtn() {
			return this.$store.state.desktop.dragCtn;
		},
		coms() {
			return this.param.coms;
		},
		flex() {
			return this.param.flex;
		},
		com1() {
			return this.param.com1;
		},
		com2() {
			return this.param.com2;
		},
	},
}
</script>

<style scoped>
</style>